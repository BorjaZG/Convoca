# Arquitectura — Convoca

## Visión general

Convoca es un monorepo pnpm con tres paquetes: una API REST (`apps/api`), una SPA (`apps/web`) y tipos compartidos (`packages/shared`). No hay servidor de renderizado; el frontend es completamente estático y se comunica con el backend exclusivamente mediante HTTP.

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
│   │       ├── services/       # Lógica de negocio desacoplada del transporte HTTP
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

**Por qué cookies httpOnly y no localStorage**: las cookies httpOnly son inaccesibles desde JavaScript, lo que elimina el vector de robo de tokens mediante XSS. El backend las gestiona con `Set-Cookie` y el navegador las adjunta automáticamente en cada petición con `credentials: include`. El coste es que hay que gestionar CSRF, mitigado con `sameSite: lax`.

---

## Decisiones arquitectónicas clave

### 1. Monorepo con pnpm workspaces

**Problema**: el frontend y el backend comparten un conjunto de tipos (roles, categorías, estados de entidades, respuestas paginadas). Sin monorepo, habría que duplicarlos o publicar un paquete npm privado.

**Decisión**: monorepo con tres paquetes en `pnpm-workspace.yaml`. El paquete `@convoca/shared` se importa directamente sin publish; pnpm resuelve la dependencia local con un symlink.

**Alternativa descartada**: repositorios separados. Requeriría sincronizar manualmente los tipos o usar contratos OpenAPI, añadiendo fricción sin beneficio real a esta escala.

### 2. Cookies httpOnly en lugar de localStorage para los tokens

**Problema**: los tokens JWT en localStorage son legibles por cualquier script de la página, incluyendo scripts de terceros inyectados.

**Decisión**: `accessToken` y `refreshToken` viajan en cookies httpOnly con `sameSite: lax`. El backend los emite con `Set-Cookie`; el frontend nunca los lee directamente.

**Coste asumido**: CORS requiere `credentials: true` tanto en el servidor como en cada `fetch`. El atributo `sameSite: lax` mitiga CSRF para formularios cross-origin (el caso más común), aunque no protege completamente contra peticiones GET cross-origin con side effects.

### 3. Context API + useReducer en lugar de Redux o Zustand

**Problema**: el estado global se limita a tres dominios independientes: sesión, tema y toasts. Redux añadiría boilerplate (reducers, actions creators, selectors, middleware) desproporcionado al tamaño del problema.

**Decisión**: tres contextos separados con `useReducer`/`useState`. Cada consumidor solo se re-renderiza cuando cambia su contexto específico. Sin dependencias externas de gestión de estado.

**Cuándo reconsiderar**: si el número de contextos crece por encima de cinco con interacciones cruzadas frecuentes, la migración a Zustand es directa porque la API de los hooks (`useAuth`, `useToast`, `useTheme`) no cambia para los consumidores.

### 4. Servicios separados de componentes (frontend)

**Problema**: si los componentes llaman directamente a `fetch`, son imposibles de testear sin mockear el DOM de red, y la lógica de construcción de URLs queda dispersa.

**Decisión**: cada módulo tiene su propio service (`eventsService`, `reservationsService`, etc.) que encapsula las llamadas HTTP. Los componentes y hooks los consumen. En tests, se mockea el módulo de servicio completo con `vi.mock`.

**Resultado**: `EventDetailPage.test.tsx` puede testear el comportamiento de la página sin red real, solo mockeando `eventsService.getById`.

### 5. Firma server-side para subidas a Cloudinary

**Problema**: si el frontend tuviera la `CLOUDINARY_API_SECRET`, cualquiera podría hacer subidas no autorizadas inspeccionando el código o el tráfico de red.

**Decisión**: el frontend nunca ve la API secret. El endpoint `POST /api/upload/sign` (solo para ORGANIZER y ADMIN) genera una firma HMAC con timestamp que Cloudinary valida en la subida. La firma caduca al no tener una ventana de tiempo rígida, pero el timestamp es verificado por Cloudinary.

**Flujo**: frontend solicita firma → backend firma con secret → frontend sube directamente a Cloudinary usando la firma → Cloudinary valida y almacena → frontend guarda la URL pública resultante junto al evento.

---

## Modelos de datos (Prisma)

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
        Float latitude
        Float longitude
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

---

## Stack completo

| Capa                | Tecnología                           | Versión    |
| ------------------- | ------------------------------------ | ---------- |
| Runtime             | Node.js                              | 20 LTS     |
| Framework API       | Express                              | 4.x        |
| ORM                 | Prisma                               | 5.x        |
| Base de datos       | PostgreSQL                           | 16         |
| Validación          | Zod                                  | 3.x        |
| Autenticación       | jsonwebtoken + bcryptjs              | —          |
| Imágenes            | Cloudinary SDK                       | 2.x        |
| Framework web       | Vite + React                         | 5.x + 18.x |
| Lenguaje            | TypeScript                           | 5.x        |
| Estilos             | Tailwind CSS + shadcn/ui             | 3.x        |
| Formularios         | react-hook-form                      | 7.x        |
| Gráficos            | Recharts                             | 2.x        |
| Iconos              | lucide-react                         | —          |
| Testing             | Vitest + Supertest + Testing Library | —          |
| Gestión de paquetes | pnpm workspaces                      | 9.x        |
