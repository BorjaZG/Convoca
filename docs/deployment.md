# Despliegue — Convoca

## Setup local (desarrollo)

### Qué necesitas tener instalado

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 20 LTS | Ejecutar API y Web |
| pnpm | 9.x | Gestionar dependencias del monorepo |
| Docker + Docker Compose | Cualquier versión reciente | Levantar PostgreSQL |

Comprueba que todo está:

```bash
node -v        # v20.x.x
pnpm -v        # 9.x.x
docker -v      # Docker version 2x.x.x
```

---

### 1. Clonar e instalar

```bash
git clone https://github.com/BorjaZG/convoca.git
cd convoca
pnpm install
```

`pnpm install` instala las dependencias de los tres paquetes (api, web, shared) y enlaza `@convoca/shared` como dependencia local.

---

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

Levanta un contenedor de PostgreSQL 16 en el puerto 5432 con estas credenciales:

| Variable | Valor |
|---|---|
| Usuario | `convoca` |
| Contraseña | `convoca` |
| Base de datos | `convoca` |
| Puerto | `5432` |

Para comprobar que está corriendo:

```bash
docker compose ps
```

---

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

El fichero ya viene apuntando a la BD del paso anterior. Si quieres usar la subida de imágenes, rellena las credenciales de Cloudinary:

```env
DATABASE_URL=postgresql://convoca:convoca@localhost:5432/convoca

JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-refresh

PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Cloudinary (necesario para subir carteles de eventos)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

El frontend no necesita `.env` en desarrollo — usa `http://localhost:4000` por defecto. Si lo necesitas, crea `apps/web/.env.local` con `VITE_API_URL=http://localhost:4000`.

---

### 4. Migraciones y seed

Crea las tablas:

```bash
pnpm --filter api exec prisma migrate dev
```

Opcionalmente, carga datos de prueba (3 usuarios con los tres roles + eventos, reservas y reseñas):

```bash
pnpm --filter api exec tsx prisma/seed.ts
```

---

### 5. Arrancar

```bash
pnpm dev
```

Levanta las dos apps a la vez:

| App | URL |
|---|---|
| API | http://localhost:4000 |
| Web | http://localhost:5173 |

Comprueba que la API responde:

```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}
```

---

### Correr tests

Los tests de backend usan la BD real, así que necesitas Docker corriendo.

```bash
# Todo
pnpm test

# Solo backend
pnpm --filter api test

# Solo frontend
pnpm --filter web test

# Con cobertura
pnpm --filter api exec vitest run --coverage
pnpm --filter web exec vitest run --coverage
```

Los tests de backend crean y limpian sus propios datos (usan emails `@convoca.test`), no interfieren con el seed.

---

### Scripts disponibles

**Desde la raíz:**

| Script | Qué hace |
|---|---|
| `pnpm dev` | Levanta API y Web en paralelo con hot reload |
| `pnpm build` | Compila todo |
| `pnpm test` | Corre todos los tests |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

**Solo API (`pnpm --filter api <script>`):**

| Script | Qué hace |
|---|---|
| `dev` | Servidor con recarga automática |
| `build` | Compila a `dist/` |
| `start` | Ejecuta el build compilado |
| `test` | Tests con Vitest |

**Solo Web (`pnpm --filter web <script>`):**

| Script | Qué hace |
|---|---|
| `dev` | Servidor Vite con HMR |
| `build` | tsc + vite build |
| `preview` | Sirve el build en local |
| `test` | Tests con Vitest |

---

## Despliegue en la nube

Pendiente de documentar:

- Proveedor para la API (Railway / Render / Fly.io)
- Proveedor para el frontend (Vercel / Netlify)
- Variables de entorno en producción
- Base de datos gestionada
- Dominio y CORS en producción
- CI/CD