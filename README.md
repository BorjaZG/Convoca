# Convoca

Plataforma de eventos culturales locales. Permite a organizadores publicar conciertos, talleres, exposiciones y más; a usuarios reservar entradas; y a administradores gestionar la plataforma.

Monorepo pnpm con backend REST (Node + Express + Prisma + PostgreSQL) y frontend SPA (Vite + React 18 + TypeScript + Tailwind + shadcn/ui).

---

## Stack

| Capa | Tecnología |
|---|---|
| API | Node 20 · Express 4 · TypeScript · Prisma · PostgreSQL 16 |
| Web | Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui |
| Auth | JWT en cookies httpOnly · bcryptjs · refresh tokens en BD |
| Imágenes | Cloudinary (firma server-side, subida directa desde cliente) |
| Validación | Zod (backend y frontend) · react-hook-form |
| Gráficos | Recharts |
| Testing | Vitest · Supertest · Testing Library (116 tests) |
| Shared | `@convoca/shared` — tipos TypeScript compartidos |

---

## Estructura del monorepo

```
convoca/
├── apps/
│   ├── api/                # Backend REST
│   │   ├── prisma/         # Schema, migraciones y seed
│   │   └── src/
│   │       ├── config/     # env, cloudinary, prisma singleton
│   │       ├── controllers/
│   │       ├── middleware/  # requireAuth, requireRole, validate, errorHandler
│   │       ├── routes/
│   │       └── services/   # Lógica de negocio
│   └── web/                # Frontend SPA
│       └── src/
│           ├── components/ # ui/ (shadcn) + common/ + events/ + dashboard/
│           ├── context/    # AuthContext, ToastContext, ThemeContext
│           ├── hooks/      # useFetch, useEvents, useReservations, useStats…
│           ├── pages/      # Por módulo: public/, events/, user/, organizer/, admin/
│           ├── routes/     # AppRouter, ProtectedRoute, RoleRoute
│           └── services/   # api.ts (fetch wrapper) + un service por módulo
└── packages/
    └── shared/             # Tipos y enums compartidos (Role, Category, EventStatus…)
```

---

## Setup rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/BorjaZG/convoca.git
cd convoca
pnpm install
```

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
# Edita apps/api/.env para añadir las credenciales de Cloudinary si las necesitas
```

### 4. Migraciones (y seed opcional)

```bash
pnpm --filter api exec prisma migrate dev
pnpm --filter api exec tsx prisma/seed.ts   # opcional — carga datos de prueba
```

### 5. Desarrollo

```bash
pnpm dev
# API → http://localhost:4000
# Web → http://localhost:5173
```

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `pnpm dev` | Levanta API y Web en paralelo (watch mode) |
| `pnpm build` | Compila API y Web |
| `pnpm test` | Ejecuta los 116 tests del monorepo |
| `pnpm lint` | ESLint en todos los paquetes |
| `pnpm format` | Prettier en todos los ficheros |

---

## Tests

La suite requiere que el contenedor de PostgreSQL esté corriendo (los tests de backend usan BD real).

```bash
# Todo el monorepo
pnpm test

# Solo backend
pnpm --filter api test

# Solo frontend
pnpm --filter web test
```

116 tests en total: 48 de backend (Vitest + Supertest) y 68 de frontend (Vitest + Testing Library).

---

## Documentación técnica

La carpeta [`/docs`](docs/) contiene la documentación completa del proyecto:

| Documento | Contenido |
|---|---|
| [architecture.md](docs/architecture.md) | Diagrama de capas, flujo de auth, modelos de datos, decisiones arquitectónicas |
| [api.md](docs/api.md) | Referencia completa de todos los endpoints |
| [error-handling.md](docs/error-handling.md) | Errores tipados, middleware, interceptor de 401, toasts automáticos |
| [state-management.md](docs/state-management.md) | Estrategia de estado: contextos, hooks de fetching, criterios de decisión |
| [testing-strategy.md](docs/testing-strategy.md) | Qué se testea y por qué, patrones, cómo añadir tests |
| [deployment.md](docs/deployment.md) | Setup local completo; sección de despliegue en la nube pendiente (fase 9) |
| [ai-usage.md](docs/ai-usage.md) | Uso de IA durante el desarrollo (para completar antes de la defensa) |
