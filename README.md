# Convoca

Plataforma de eventos culturales locales. Monorepo con pnpm workspaces.

## Stack

| Capa     | Tecnología                                      |
| -------- | ----------------------------------------------- |
| API      | Node 20 · Express 4 · TypeScript · Prisma · PostgreSQL |
| Web      | Vite · React 18 · TypeScript · Tailwind · shadcn/ui |
| Shared   | Tipos y schemas Zod compartidos                 |

## Estructura

```
convoca/
├── apps/
│   ├── api/          # Backend REST
│   └── web/          # Frontend SPA
├── packages/
│   └── shared/       # Tipos y schemas Zod
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Setup

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Base de datos

```bash
docker compose up -d
```

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
# Edita apps/api/.env si es necesario
```

### 4. Migraciones

```bash
pnpm --filter api prisma migrate dev --name init
```

### 5. Desarrollo

```bash
pnpm dev
# API → http://localhost:4000
# Web → http://localhost:5173
```

## Scripts raíz

| Script        | Descripción                          |
| ------------- | ------------------------------------ |
| `pnpm dev`    | Levanta api y web en paralelo        |
| `pnpm build`  | Construye ambas apps                 |
| `pnpm test`   | Ejecuta tests de todas las apps      |
| `pnpm lint`   | ESLint + Prettier en todos los pkgs  |
| `pnpm format` | Formatea todos los ficheros          |

## Endpoints disponibles

- `GET /health` → `{ status: "ok", timestamp }`
