# Despliegue — Convoca

## Setup local

### Lo que necesitas

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 20 LTS | Ejecutar API y Web |
| pnpm | 9.x | Gestionar dependencias |
| Docker + Docker Compose | Cualquier versión reciente | Levantar PostgreSQL |

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

`pnpm install` instala las dependencias de los tres paquetes y enlaza `@convoca/shared` como dependencia local automáticamente.

---

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

Levanta PostgreSQL 16 en el puerto 5432 con estas credenciales:

| Variable | Valor |
|---|---|
| Usuario | `convoca` |
| Contraseña | `convoca` |
| Base de datos | `convoca` |
| Puerto | `5432` |

---

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

El fichero ya apunta a la BD del paso anterior. Si quieres usar la subida de imágenes, rellena las credenciales de Cloudinary:

```env
DATABASE_URL=postgresql://convoca:convoca@localhost:5432/convoca

JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-refresh

PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Cloudinary (para subir carteles de eventos)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

El frontend no necesita `.env` en desarrollo, usa `http://localhost:4000` por defecto.

---

### 4. Migraciones y seed

Crear las tablas:

```bash
pnpm --filter api exec prisma migrate dev
```

Opcionalmente, cargar datos de prueba (3 usuarios con sus roles + eventos, reservas y reseñas):

```bash
pnpm --filter api exec tsx prisma/seed.ts
```

---

### 5. Arrancar

```bash
pnpm dev
```

| App | URL |
|---|---|
| API | http://localhost:4000 |
| Web | http://localhost:5173 |

Para comprobar que la API está viva:

```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}
```

---

### Correr los tests

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

Los tests crean y limpian sus propios datos (emails `@convoca.test`) y no interfieren con el seed.

---

### Scripts disponibles

**Desde la raíz:**

| Script | Qué hace |
|---|---|
| `pnpm dev` | Levanta API y Web en paralelo |
| `pnpm build` | Compila todo |
| `pnpm test` | Corre todos los tests |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

**Solo API:**

| Script | Qué hace |
|---|---|
| `dev` | Servidor con recarga automática |
| `build` | Compila a `dist/` |
| `start` | Ejecuta el build compilado |
| `test` | Tests con Vitest |

**Solo Web:**

| Script | Qué hace |
|---|---|
| `dev` | Servidor Vite con HMR |
| `build` | tsc + vite build |
| `preview` | Sirve el build en local |
| `test` | Tests con Vitest |

---

## Despliegue en producción

Pendiente. La idea sería:

- API en Railway o Render
- Frontend en Vercel o Netlify
- PostgreSQL gestionado (Railway o Supabase)
- Configurar variables de entorno y CORS para el dominio de producción
