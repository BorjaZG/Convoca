# Arquitectura — Convoca

## Qué es Convoca a nivel técnico

Es un monorepo con pnpm que tiene tres paquetes: la API REST (`apps/api`), el frontend SPA (`apps/web`) y un paquete de tipos compartidos (`packages/shared`). El frontend es completamente estático — no hay SSR ni nada de eso — y habla con el backend solo por HTTP.

La idea de usar monorepo es sencilla: frontend y backend comparten tipos (roles, categorías, estados de eventos, etc.) y sin monorepo tendría que duplicarlos o montar un paquete npm privado, que para un proyecto de este tamaño es pasarse.

---

## Diagrama de capas

```mermaid
graph TB
    subgraph Cliente
        SPA["SPA React 18\n(Vite + TypeScript)"]
        CTX["Contextos globales\nAuthContext · ToastContext · ThemeContext"]
        HOOKS["Hooks de datos\nuseEvents · useReservations · useStats"]
        SVC["Servicios frontend\neventsService · authService · …"]
        API_TS["api.ts\n(fetch wrapper con auto-refresh)"]
    end

    subgraph API ["apps/api (Express)"]
        MIDDLE["Middlewares\nhelmet · cors · morgan · cookieParser"]
        AUTH_MW["requireAuth\nrequireRole"]
        VALIDATE["validate(ZodSchema)"]
        CTRL["Controladores\nauth · events · reservations · reviews · stats · upload · users"]
        SRVC["Servicios de negocio\nauthService · eventsService · …"]
        ERR["errorHandler\n(AppError · ZodError · 500)"]
    end

    subgraph Persistencia
        PRISMA["Prisma ORM"]
        DB[("PostgreSQL 16")]
    end

    CLOUD["Cloudinary CDN\n(imágenes de eventos)"]

    SPA --> CTX
    CTX --> HOOKS
    HOOKS --> SVC
    SVC --> API_TS
    API_TS -->|"HTTP + cookies httpOnly"| MIDDLE
    MIDDLE --> AUTH_MW
    AUTH_MW --> VALIDATE
    VALIDATE --> CTRL
    CTRL --> SRVC
    SRVC --> PRISMA
    PRISMA --> DB
    SRVC -->|"firma server-side"| CLOUD
    API_TS -->|"upload directo"| CLOUD
    CTRL --> ERR
```

Básicamente el flujo va así: el componente React usa un hook → el hook llama a un servicio → el servicio usa `api.ts` (que es un wrapper de fetch) → llega al backend → pasa por los middlewares → llega al controlador → el controlador llama al servicio de negocio → el servicio usa Prisma para hablar con PostgreSQL.

Ningún componente hace `fetch` directamente. Todo pasa por la capa de servicios.

---

## Estructura del monorepo

```
convoca/
├── apps/
│   ├── api/                    # Backend REST
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Modelos de BD
│   │   │   ├── migrations/     # Historial de migraciones
│   │   │   └── seed.ts         # Datos iniciales
│   │   └── src/
│   │       ├── config/         # env.ts, cloudinary.ts, prisma.ts
│   │       ├── controllers/    # Un fichero por módulo
│   │       ├── middleware/     # requireAuth, requireRole, validate, errorHandler
│   │       ├── routes/         # Un fichero por módulo + index.ts
│   │       ├── services/       # Lógica de negocio separada del HTTP
│   │       └── index.ts        # Punto de entrada
│   └── web/                    # Frontend SPA
│       └── src/
│           ├── components/     # ui/ (shadcn) + common/ + events/ + dashboard/
│           ├── context/        # AuthContext, ToastContext, ThemeContext
│           ├── hooks/          # useFetch, useEvents, useEvent, useReservations…
│           ├── lib/            # utils.ts, formatters.ts
│           ├── pages/          # Por módulo: public/, events/, user/, organizer/, admin/
│           ├── routes/         # AppRouter, ProtectedRoute, RoleRoute
│           ├── services/       # Uno por módulo + api.ts
│           └── types/          # Extensiones locales de @convoca/shared
└── packages/
    └── shared/                 # Tipos TypeScript + enums compartidos
        └── src/types/index.ts
```

---

## Flujo de autenticación

Este es probablemente el flujo más complejo de la app, así que lo explico con un diagrama de secuencia:

```mermaid
sequenceDiagram
    actor U as Usuario
    participant W as Web (api.ts)
    participant A as API /auth
    participant DB as PostgreSQL

    U->>W: POST /login {email, password}
    W->>A: fetch POST /api/auth/login (credentials: include)
    A->>DB: findUser por email
    DB-->>A: Usuario con passwordHash
    A->>A: bcrypt.compare(password, hash)
    A->>A: signJWT(accessToken, 15 min)
    A->>DB: INSERT RefreshToken (expira 7 días)
    A-->>W: Set-Cookie: accessToken + refreshToken (httpOnly, sameSite=lax)
    W-->>U: dispatch AUTH_SUCCESS → navegar

    Note over W,A: Tiempo después — accessToken expira

    W->>A: GET /api/events (cookie con accessToken expirado)
    A-->>W: 401 Unauthorized
    W->>W: primer intento → auto-retry
    W->>A: POST /api/auth/refresh (refreshToken cookie)
    A->>DB: findRefreshToken + validar expiración y revokedAt
    A->>DB: UPDATE revokedAt = now (token anterior)
    A->>DB: INSERT nuevo RefreshToken
    A-->>W: Set-Cookie: nuevas cookies
    W->>A: GET /api/events (nuevo accessToken)
    A-->>W: 200 {data: [...]}

    Note over W,A: Si el refresh también falla

    W->>W: dispatch LOGOUT → redirigir a /login
```

Lo importante aquí: cuando el accessToken caduca (15 minutos), el frontend no le pide al usuario que vuelva a loguearse. Lo que hace `api.ts` es interceptar el 401, llamar a `/refresh` por detrás, y reintentar la petición original con el nuevo token. El usuario ni se entera. Si el refresh token también ha caducado (7 días) o está revocado, ahí sí se cierra sesión.

---

## Decisiones técnicas y por qué las tomé

### Cookies httpOnly en vez de localStorage

Los JWT en localStorage se pueden leer desde cualquier script que corra en la página (incluyendo scripts de terceros). Con cookies httpOnly el JavaScript no puede acceder al token. El navegador las manda automáticamente con `credentials: include` y listo.

El coste es que hay que configurar CORS con `credentials: true` y `sameSite: lax`, pero me parece un precio razonable por la seguridad que ganas.

### Context API + useReducer en vez de Redux

El estado global de Convoca se reduce a tres cosas: sesión del usuario, tema visual y toasts. Montar Redux para eso me parecía desproporcionado — mucho boilerplate (actions, reducers, selectors, store, middleware) para un problema que se resuelve con tres contextos de React.

Si en el futuro creciera mucho (más de 5-6 contextos con interacciones entre ellos), migraría a Zustand, que es más ligero que Redux. Pero por ahora Context basta.

### Servicios separados de componentes

Si un componente llama directamente a `fetch`, es muy difícil de testear y la lógica de construir URLs queda repartida por todas partes. Prefiero tener un servicio por módulo (`eventsService`, `reservationsService`...) que encapsule las llamadas. Así los componentes solo llaman a funciones con nombres claros y en los tests mockeo el servicio entero con `vi.mock`.

### Firma server-side para Cloudinary

Cuando un organizador sube un cartel, el frontend NO tiene la API secret de Cloudinary. El flujo es: el frontend pide una firma al backend → el backend firma con el secret → el frontend sube directamente a Cloudinary con esa firma. Así el secret nunca sale del servidor y nadie puede hacer subidas no autorizadas inspeccionando el código del frontend.

### Monorepo con pnpm

La alternativa era tener dos repos separados. El problema con eso es que los tipos (Role, Category, EventStatus, etc.) se comparten entre cliente y servidor. Con monorepo, el paquete `@convoca/shared` se importa directamente y pnpm lo enlaza con un symlink. Si cambio un tipo, TypeScript me avisa en los dos lados a la vez.

---

## Modelo de datos

```mermaid
erDiagram
    User {
        String id PK
        String email
        String passwordHash
        String name
        Role role
        String avatarUrl
    }
    RefreshToken {
        String id PK
        String token
        String userId FK
        DateTime expiresAt
        DateTime revokedAt
    }
    Event {
        String id PK
        String title
        String description
        Category category
        DateTime startDate
        DateTime endDate
        String venue
        String city
        Int capacity
        Float price
        String imageUrl
        String imagePublicId
        EventStatus status
        Boolean featured
        String organizerId FK
    }
    Reservation {
        String id PK
        Int quantity
        Float totalPrice
        ReservationStatus status
        String userId FK
        String eventId FK
    }
    Review {
        String id PK
        Int rating
        String comment
        String userId FK
        String eventId FK
    }

    User ||--o{ RefreshToken : "tiene"
    User ||--o{ Event : "organiza"
    User ||--o{ Reservation : "hace"
    User ||--o{ Review : "escribe"
    Event ||--o{ Reservation : "recibe"
    Event ||--o{ Review : "recibe"
```

Las relaciones son bastante directas: un usuario puede organizar eventos (si es ORGANIZER), hacer reservas y escribir reseñas. Un evento tiene reservas y reseñas. La única restricción interesante es que un usuario solo puede dejar una reseña por evento (constraint `@@unique([userId, eventId])` en Prisma) y solo si tiene una reserva con estado ATTENDED.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework API | Express | 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 16 |
| Validación | Zod | 3.x |
| Auth | jsonwebtoken + bcryptjs | — |
| Imágenes | Cloudinary SDK | 2.x |
| Frontend | Vite + React | 5.x + 18.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS + shadcn/ui | 3.x |
| Formularios | react-hook-form | 7.x |
| Gráficos | Recharts | 2.x |
| Iconos | lucide-react | — |
| Testing | Vitest + Supertest + Testing Library | — |
| Paquetes | pnpm workspaces | 9.x |