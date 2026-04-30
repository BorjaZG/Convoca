# Despliegue — Convoca

## Setup local (desarrollo)

### Requisitos previos

| Herramienta             | Versión mínima             | Para qué                             |
| ----------------------- | -------------------------- | ------------------------------------ |
| Node.js                 | 20 LTS                     | Ejecutar API y Web                   |
| pnpm                    | 9.x                        | Gestión de dependencias del monorepo |
| Docker + Docker Compose | Cualquier versión reciente | Levantar PostgreSQL en local         |

Comprueba que están disponibles:

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

`pnpm install` instala las dependencias de los tres paquetes (`apps/api`, `apps/web`, `packages/shared`) y enlaza `@convoca/shared` como dependencia local mediante symlink.

---

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Esto arranca un contenedor con PostgreSQL 16 en el puerto `5432`. Las credenciales están definidas en `docker-compose.yml`:

| Variable      | Valor     |
| ------------- | --------- |
| Usuario       | `convoca` |
| Contraseña    | `convoca` |
| Base de datos | `convoca` |
| Puerto        | `5432`    |

Comprueba que el contenedor está corriendo:

```bash
docker compose ps
```

---

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

El fichero generado ya apunta a la base de datos del paso anterior. Edítalo para añadir las credenciales de Cloudinary si quieres usar la subida de imágenes:

```env
DATABASE_URL=postgresql://convoca:convoca@localhost:5432/convoca

# Secretos JWT — cámbialo en producción
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-refresh

PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Cloudinary — necesario para subir carteles de eventos
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

El frontend no necesita fichero `.env` en desarrollo: usa `http://localhost:4000` como base URL por defecto. Si necesitas apuntarlo a otra dirección, crea `apps/web/.env.local`:

```env
VITE_API_URL=http://localhost:4000
```

---

### 4. Migraciones y seed

Aplica el esquema de Prisma a la base de datos:

```bash
pnpm --filter api exec prisma migrate dev
```

Opcionalmente, carga datos de prueba:

```bash
pnpm --filter api exec tsx prisma/seed.ts
```

El seed crea usuarios de ejemplo con los tres roles (USER, ORGANIZER, ADMIN) y varios eventos publicados para poder explorar la app sin crear datos manualmente.

---

### 5. Arrancar en modo desarrollo

```bash
pnpm dev
```

Lanza ambas apps en paralelo:

| App | URL                     |
| --- | ----------------------- |
| API | `http://localhost:4000` |
| Web | `http://localhost:5173` |

Comprueba que la API responde:

```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}
```

---

### Correr los tests

Los tests de backend requieren la base de datos levantada (usan una BD real, no mocks). Asegúrate de que el contenedor Docker está corriendo.

```bash
# Todo el monorepo
pnpm test

# Solo backend
pnpm --filter api test

# Solo frontend
pnpm --filter web test

# Con cobertura (backend)
pnpm --filter api exec vitest run --coverage

# Con cobertura (frontend)
pnpm --filter web exec vitest run --coverage
```

Los tests de backend crean y limpian sus propios datos usando emails del dominio `@convoca.test`. No interfieren con los datos del seed.

---

### Scripts disponibles

**Raíz del monorepo:**

| Script        | Descripción                                |
| ------------- | ------------------------------------------ |
| `pnpm dev`    | Levanta API y Web en paralelo (watch mode) |
| `pnpm build`  | Compila API (tsc) y Web (tsc + vite build) |
| `pnpm test`   | Ejecuta tests de todas las apps            |
| `pnpm lint`   | ESLint en todos los paquetes               |
| `pnpm format` | Prettier en todos los ficheros             |

**Solo API (`pnpm --filter api <script>`):**

| Script  | Descripción                        |
| ------- | ---------------------------------- |
| `dev`   | tsx watch — recarga en cada cambio |
| `build` | Compila a `dist/`                  |
| `start` | Ejecuta el build compilado         |
| `test`  | Vitest en modo run                 |
| `seed`  | Carga datos de prueba              |

**Solo Web (`pnpm --filter web <script>`):**

| Script    | Descripción             |
| --------- | ----------------------- |
| `dev`     | Servidor Vite con HMR   |
| `build`   | tsc + vite build        |
| `preview` | Sirve el build en local |
| `test`    | Vitest en modo run      |

---

Puntos a documentar:

- Proveedor de hosting para la API (Railway / Render / Fly.io)
- Proveedor de hosting para el frontend (Vercel / Netlify)
- Configuración de variables de entorno en producción
- Base de datos gestionada (Supabase / Neon / Railway PostgreSQL)
- Dominio y CORS en producción
- CI/CD pipeline
