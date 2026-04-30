# Referencia de la API — Convoca

Base URL: `http://localhost:4000/api`

**Autenticación**: los tokens viajan en cookies httpOnly (`accessToken`, `refreshToken`). Todas las peticiones que requieren auth deben incluir `credentials: include`.

**Códigos de error comunes**:
- `400` — validación fallida (Zod) → `{error, details}`
- `401` — no autenticado o token inválido → `{error}`
- `403` — rol insuficiente o recurso ajeno → `{error}`
- `404` — recurso no encontrado → `{error}`
- `409` — conflicto (email duplicado, capacidad insuficiente, etc.) → `{error}`
- `500` — error interno → `{error: "Internal server error"}`

---

## Health

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | Pública | Comprueba que el servidor está activo |

**Respuesta 200:**
```json
{ "status": "ok", "timestamp": "2026-04-29T10:00:00.000Z" }
```

---

## Auth — `/api/auth`

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/register` | Pública | `{email, password, name}` | `{user}` + cookies |
| POST | `/login` | Pública | `{email, password}` | `{user}` + cookies |
| POST | `/refresh` | Pública (cookie) | — | `{message}` + nuevas cookies |
| POST | `/logout` | Pública (cookie) | — | `{message}` + limpia cookies |
| GET | `/me` | USER · ORGANIZER · ADMIN | — | `{user}` |

### Body: POST /register
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo8chars1",
  "name": "Nombre Apellido"
}
```
Reglas: `email` válido; `password` mínimo 8 caracteres y al menos 1 dígito; `name` entre 2 y 50 caracteres.

### Body: POST /login
```json
{ "email": "usuario@ejemplo.com", "password": "contraseña" }
```

### Respuesta: usuario (SafeUser)
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "role": "USER",
    "avatarUrl": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Events — `/api/events`

| Método | Ruta | Auth | Roles | Body | Descripción |
|---|---|---|---|---|---|
| GET | `/` | Pública | — | — | Lista eventos publicados con filtros y paginación |
| GET | `/mine` | Requerida | ORGANIZER · ADMIN | — | Eventos del organizador autenticado |
| GET | `/pending` | Requerida | ADMIN | — | Eventos en estado DRAFT pendientes de revisión |
| GET | `/:id` | Pública | — | — | Detalle de un evento |
| POST | `/` | Requerida | ORGANIZER · ADMIN | CreateEvent | Crear evento |
| PUT | `/:id` | Requerida | ORGANIZER · ADMIN | UpdateEvent | Actualizar evento (propietario o ADMIN) |
| DELETE | `/:id` | Requerida | ORGANIZER · ADMIN | — | Eliminar evento (o cancelar si tiene reservas CONFIRMED) |

### Query params: GET /events

| Param | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 10) |
| `category` | string | Filtrar por categoría (CONCIERTO, EXPOSICION, TALLER, MERCADILLO, TEATRO, CONFERENCIA, GASTRONOMIA, DEPORTE) |
| `city` | string | Filtrar por ciudad |
| `q` | string | Búsqueda en título y descripción |
| `startDate` | ISO string | Eventos desde esta fecha |
| `endDate` | ISO string | Eventos hasta esta fecha |
| `maxPrice` | number | Precio máximo |
| `sortBy` | string | Campo de orden: `startDate`, `price`, `createdAt`, `title` |
| `order` | `asc` \| `desc` | Dirección del orden |

### Body: POST /events (CreateEvent)
```json
{
  "title": "Festival de Jazz",
  "description": "Descripción de al menos 10 caracteres",
  "category": "CONCIERTO",
  "startDate": "2026-06-15T20:00:00.000Z",
  "endDate": "2026-06-15T23:00:00.000Z",
  "venue": "Teatro Principal",
  "city": "Valencia",
  "latitude": 39.4699,
  "longitude": -0.3763,
  "capacity": 200,
  "price": 15.0,
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "convoca/events/abc123",
  "status": "DRAFT",
  "featured": false
}
```
`latitude`, `longitude`, `imageUrl`, `imagePublicId` y `featured` son opcionales. `status` admite `DRAFT` o `PUBLISHED`; default `DRAFT`.

### Body: PUT /events/:id (UpdateEvent)
Igual que CreateEvent pero todos los campos son opcionales. `status` además admite `CANCELLED`.

### Respuesta: evento con organizador
```json
{
  "id": "uuid",
  "title": "Festival de Jazz",
  "category": "CONCIERTO",
  "startDate": "2026-06-15T20:00:00.000Z",
  "endDate": "2026-06-15T23:00:00.000Z",
  "venue": "Teatro Principal",
  "city": "Valencia",
  "capacity": 200,
  "price": 15.0,
  "status": "PUBLISHED",
  "featured": false,
  "averageRating": 4.2,
  "availableCapacity": 185,
  "organizer": { "id": "uuid", "name": "Ana García", "email": "...", "role": "ORGANIZER" },
  "_count": { "reservations": 15, "reviews": 8 }
}
```

### Respuesta: listado paginado
```json
{
  "data": [ /* array de EventWithOrganizer */ ],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
}
```

---

## Reservations — `/api/reservations`

Todas las rutas requieren autenticación.

| Método | Ruta | Auth | Roles | Body | Descripción |
|---|---|---|---|---|---|
| POST | `/` | Requerida | USER · ORGANIZER · ADMIN | CreateReservation | Crear reserva |
| GET | `/me` | Requerida | — | — | Mis reservas |
| GET | `/event/:eventId` | Requerida | ORGANIZER · ADMIN | — | Reservas de un evento (solo propietario o ADMIN) |
| PATCH | `/:id/cancel` | Requerida | — | — | Cancelar una reserva |

### Body: POST /reservations
```json
{ "eventId": "uuid", "quantity": 2 }
```
El backend valida que el evento esté en estado `PUBLISHED` y que haya capacidad disponible (`capacity - reservas CONFIRMED`). Calcula `totalPrice = event.price * quantity`.

### Query params: GET /reservations/me

| Param | Tipo | Descripción |
|---|---|---|
| `status` | string | Filtrar: `CONFIRMED`, `CANCELLED`, `ATTENDED` |
| `startDate` | ISO string | Reservas de eventos desde esta fecha |
| `endDate` | ISO string | Reservas de eventos hasta esta fecha |

### Respuesta: reserva con evento
```json
{
  "id": "uuid",
  "quantity": 2,
  "totalPrice": 30.0,
  "status": "CONFIRMED",
  "createdAt": "2026-04-01T10:00:00.000Z",
  "userId": "uuid",
  "eventId": "uuid",
  "event": {
    "id": "uuid",
    "title": "Festival de Jazz",
    "startDate": "2026-06-15T20:00:00.000Z",
    "venue": "Teatro Principal",
    "city": "Valencia",
    "imageUrl": "https://..."
  }
}
```

---

## Reviews — `/api/reviews`

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/` | Requerida | CreateReview | Crear reseña (solo si la reserva tiene status ATTENDED) |
| GET | `/event/:eventId` | Pública | — | Reseñas de un evento (paginadas) |
| DELETE | `/:id` | Requerida | — | Eliminar reseña (autor o ADMIN) |

### Body: POST /reviews
```json
{ "eventId": "uuid", "rating": 4, "comment": "Excelente ambiente y organización." }
```
`rating` entre 1 y 5; `comment` entre 10 y 1000 caracteres. Solo se puede crear una reseña por usuario por evento. Requiere haber asistido (reserva con status `ATTENDED`).

### Query params: GET /reviews/event/:eventId

| Param | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 10) |

### Respuesta: reseña con autor
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 4,
      "comment": "Excelente ambiente.",
      "createdAt": "2026-04-20T12:00:00.000Z",
      "eventId": "uuid",
      "userId": "uuid",
      "user": { "id": "uuid", "name": "Pedro López", "avatarUrl": null }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

---

## Stats — `/api/stats`

Todas las rutas requieren autenticación. La respuesta varía según el rol del usuario autenticado.

| Método | Ruta | Auth | Query | Descripción |
|---|---|---|---|---|
| GET | `/me` | Requerida | `startDate?`, `endDate?` | Estadísticas según el rol del usuario |

### Respuesta para rol USER
```json
{
  "totalReservations": 5,
  "eventsAttended": 2,
  "upcomingEvents": 3
}
```

### Respuesta para rol ORGANIZER
```json
{
  "activeEvents": 3,
  "totalReservations": 120,
  "totalRevenue": 1800.0,
  "averageRating": 4.3,
  "eventsByCategory": [
    { "category": "CONCIERTO", "count": 2 },
    { "category": "TALLER", "count": 1 }
  ],
  "reservationsByMonth": [
    { "month": "2025-11", "count": 15 },
    { "month": "2025-12", "count": 32 }
  ]
}
```
`reservationsByMonth` cubre los últimos 6 meses.

### Respuesta para rol ADMIN
```json
{
  "totalUsers": 250,
  "publishedEvents": 48,
  "totalReservations": 1200,
  "totalRevenue": 18400.0,
  "eventsByMonth": [
    { "month": "2025-05", "count": 4 }
  ],
  "categoryDistribution": [
    { "category": "CONCIERTO", "count": 18 }
  ],
  "topOrganizers": [
    { "id": "uuid", "name": "Ana García", "totalEvents": 8, "totalRevenue": 3200.0 }
  ]
}
```
`eventsByMonth` cubre los últimos 12 meses. `topOrganizers` devuelve los 5 primeros.

---

## Upload — `/api/upload`

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| POST | `/sign` | Requerida | ORGANIZER · ADMIN | Genera firma para subida directa a Cloudinary |

### Respuesta: firma Cloudinary
```json
{
  "signature": "abc123...",
  "timestamp": 1714385600,
  "apiKey": "tu_api_key",
  "cloudName": "tu_cloud_name",
  "folder": "convoca/events"
}
```
El frontend usa estos datos para hacer un `POST` directamente a la API de Cloudinary (`https://api.cloudinary.com/v1_1/{cloudName}/image/upload`) sin que la `CLOUDINARY_API_SECRET` salga del servidor.

---

## Users — `/api/users`

Todas las rutas requieren autenticación con rol ADMIN.

| Método | Ruta | Auth | Roles | Body | Descripción |
|---|---|---|---|---|---|
| GET | `/` | Requerida | ADMIN | — | Lista todos los usuarios (paginada, filtrable por rol) |
| PATCH | `/:id/role` | Requerida | ADMIN | `{role}` | Cambiar el rol de un usuario |
| DELETE | `/:id` | Requerida | ADMIN | — | Eliminar usuario (no puede autoeliminarse) |

### Query params: GET /users

| Param | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página |
| `role` | string | Filtrar por rol: `USER`, `ORGANIZER`, `ADMIN` |

### Body: PATCH /users/:id/role
```json
{ "role": "ORGANIZER" }
```
`role` acepta `USER`, `ORGANIZER` o `ADMIN`.

### Respuesta: listado paginado de usuarios
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "name": "Nombre",
      "role": "USER",
      "avatarUrl": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 250, "totalPages": 13 }
}
```
