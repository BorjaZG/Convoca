# API de Convoca — Endpoints

Base URL: `http://localhost:4000/api`

Los tokens van en cookies httpOnly (`accessToken` y `refreshToken`). Para que se envíen automáticamente, todas las peticiones necesitan `credentials: include`.

## Códigos de error

| Código | Qué significa |
|---|---|
| 400 | Los datos no pasan la validación |
| 401 | No estás autenticado o el token ha expirado |
| 403 | Tu rol no tiene permisos |
| 404 | El recurso no existe |
| 409 | Conflicto: email ya en uso, sin capacidad, reseña duplicada... |
| 500 | Error interno del servidor |

---

## Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Comprueba que el servidor está vivo |

Respuesta: `{ "status": "ok", "timestamp": "..." }`

---

## Auth — `/api/auth`

| Método | Ruta | Auth | Body | Qué hace |
|---|---|---|---|---|
| POST | `/register` | Pública | `{email, password, name}` | Crea usuario y devuelve cookies |
| POST | `/login` | Pública | `{email, password}` | Loguea y devuelve cookies |
| POST | `/refresh` | Cookie | — | Rota el refresh token y da cookies nuevas |
| POST | `/logout` | Cookie | — | Revoca el refresh token y limpia cookies |
| GET | `/me` | Requerida | — | Devuelve el usuario actual |

Validaciones del registro: email válido, password mínimo 8 caracteres con al menos 1 número, name entre 2 y 50 caracteres.

Respuesta de usuario (el passwordHash nunca se devuelve):
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "role": "USER",
    "avatarUrl": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Events — `/api/events`

| Método | Ruta | Auth | Roles | Qué hace |
|---|---|---|---|---|
| GET | `/` | Pública | — | Lista eventos publicados con filtros y paginación |
| GET | `/mine` | Requerida | ORGANIZER, ADMIN | Mis eventos como organizador |
| GET | `/pending` | Requerida | ADMIN | Eventos en DRAFT pendientes de revisar |
| GET | `/:id` | Pública | — | Detalle de un evento |
| POST | `/` | Requerida | ORGANIZER, ADMIN | Crear evento |
| PUT | `/:id` | Requerida | ORGANIZER, ADMIN | Editar evento (solo si eres el dueño o admin) |
| DELETE | `/:id` | Requerida | ORGANIZER, ADMIN | Borrar evento. Si tiene reservas confirmadas hace soft delete (CANCELLED) |

Filtros de GET /events (todos opcionales):

| Param | Tipo | Para qué |
|---|---|---|
| `page` | number | Página (default 1) |
| `limit` | number | Resultados por página (default 10) |
| `category` | string | CONCIERTO, EXPOSICION, TALLER, MERCADILLO, TEATRO, CONFERENCIA, GASTRONOMIA, DEPORTE |
| `city` | string | Filtrar por ciudad |
| `q` | string | Busca en título y descripción |
| `startDate` | ISO string | Eventos desde esta fecha |
| `endDate` | ISO string | Eventos hasta esta fecha |
| `maxPrice` | number | Precio máximo |
| `sortBy` | string | startDate, price, createdAt, title |
| `order` | asc / desc | Dirección del orden |

Body para crear evento:
```json
{
  "title": "Festival de Jazz",
  "description": "Descripción de al menos 10 caracteres",
  "category": "CONCIERTO",
  "startDate": "2026-06-15T20:00:00.000Z",
  "endDate": "2026-06-15T23:00:00.000Z",
  "venue": "Teatro Principal",
  "city": "Valencia",
  "capacity": 200,
  "price": 15.0,
  "status": "DRAFT"
}
```

Los campos `imageUrl`, `imagePublicId` y `featured` son opcionales.

Respuesta paginada:
```json
{
  "data": [/* array de eventos */],
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
}
```

---

## Reservations — `/api/reservations`

Todas requieren estar autenticado.

| Método | Ruta | Roles | Body | Qué hace |
|---|---|---|---|---|
| POST | `/` | Cualquier autenticado | `{eventId, quantity}` | Reservar entradas |
| GET | `/me` | Cualquier autenticado | — | Mis reservas |
| GET | `/event/:eventId` | ORGANIZER, ADMIN | — | Reservas de un evento |
| PATCH | `/:id/cancel` | Cualquier autenticado | — | Cancelar mi reserva |

Filtros de GET /reservations/me: `status` (CONFIRMED, CANCELLED, ATTENDED), `startDate`, `endDate`.

Al hacer POST, el backend comprueba que el evento esté PUBLISHED y que haya sitio. El `totalPrice` se calcula automáticamente.

---

## Reviews — `/api/reviews`

| Método | Ruta | Auth | Body | Qué hace |
|---|---|---|---|---|
| POST | `/` | Requerida | `{eventId, rating, comment}` | Crear reseña |
| GET | `/event/:eventId` | Pública | — | Reseñas de un evento (paginadas) |
| DELETE | `/:id` | Requerida | — | Borrar reseña (solo el autor o admin) |

Restricciones:
- Solo puedes reseñar si tienes una reserva con estado ATTENDED
- Una reseña por usuario por evento
- Rating entre 1 y 5, comment entre 10 y 1000 caracteres

---

## Stats — `/api/stats`

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET | `/me` | Requerida | Estadísticas según tu rol |

Devuelve datos distintos según el rol:

**USER:**
```json
{ "totalReservations": 5, "eventsAttended": 2, "upcomingEvents": 3 }
```

**ORGANIZER:**
```json
{
  "activeEvents": 3,
  "totalReservations": 120,
  "totalRevenue": 1800.0,
  "averageRating": 4.3,
  "eventsByCategory": [{ "category": "CONCIERTO", "count": 2 }],
  "reservationsByMonth": [{ "month": "2025-11", "count": 15 }]
}
```

**ADMIN:**
```json
{
  "totalUsers": 250,
  "publishedEvents": 48,
  "totalReservations": 1200,
  "totalRevenue": 18400.0,
  "eventsByMonth": [{ "month": "2025-05", "count": 4 }],
  "categoryDistribution": [{ "category": "CONCIERTO", "count": 18 }],
  "topOrganizers": [{ "id": "uuid", "name": "Ana García", "totalEvents": 8, "totalRevenue": 3200.0 }]
}
```

---

## Upload — `/api/upload`

| Método | Ruta | Auth | Roles | Qué hace |
|---|---|---|---|---|
| POST | `/sign` | Requerida | ORGANIZER, ADMIN | Genera una firma para subir imágenes a Cloudinary |

Respuesta:
```json
{
  "signature": "abc123...",
  "timestamp": 1714385600,
  "apiKey": "tu_api_key",
  "cloudName": "tu_cloud_name",
  "folder": "convoca/events"
}
```

Con estos datos el frontend sube directamente a Cloudinary. La API secret nunca sale del servidor.

---

## Users — `/api/users`

Solo para ADMIN.

| Método | Ruta | Body | Qué hace |
|---|---|---|---|
| GET | `/` | — | Lista todos los usuarios (paginada, filtrable por rol) |
| PATCH | `/:id/role` | `{role}` | Cambiar el rol de un usuario |
| DELETE | `/:id` | — | Eliminar usuario (no puede borrarse a sí mismo) |

Filtros de GET: `page`, `limit`, `role` (USER, ORGANIZER, ADMIN).
