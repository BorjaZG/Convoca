# Estrategia de testing — Convoca

## Filosofía

Para cada test me hago la misma pregunta: "si esto se rompe, ¿se cae algo importante?". Si la respuesta es no, no escribo el test. Prefiero pocos tests que cubran cosas reales que muchos tests de relleno.

La suite tiene **66 tests** en total: 26 en backend y 40 en frontend (sin contar los de E2E, que van aparte).

---

## Qué se testea en el backend

| Fichero | Tests | Qué protege |
|---|---|---|
| `auth.test.ts` | 6 | Registro, login correcto e incorrecto, acceso sin token y logout |
| `events.test.ts` | 6 | Listado público, creación, acceso sin auth y datos inválidos, detalle por id |
| `reservations.test.ts` | 4 | Que no puedes reservar sin auth ni con quantity 0, creación correcta, listado propio |
| `reviews.test.ts` | 4 | Que necesitas auth para reseñar, creación correcta, duplicado devuelve 409, listado del evento |
| `stats.test.ts` | 3 | Que cada rol recibe sus propias estadísticas y sin auth devuelve 401 |
| `upload.test.ts` | 3 | Que el endpoint de firma requiere auth, que USER recibe 403, que ORGANIZER recibe los campos correctos |

**¿Por qué tests de integración con Supertest y no tests unitarios de servicios?** Porque los bugs reales aparecen en la integración middleware → controlador → servicio → base de datos. Testear el servicio solo en memoria no habría pillado bugs como el de `requireRole` que devolvía 403 cuando no debía.

---

## Qué se testea en el frontend

| Fichero | Tests | Qué protege |
|---|---|---|
| `authReducer.test.ts` | 4 | Las transiciones principales: AUTH_SUCCESS, AUTH_FAILURE, LOGOUT, AUTH_START |
| `toastReducer.test.ts` | 3 | Añadir un toast, eliminar por id, eliminar id inexistente |
| `useAuth.test.tsx` | 3 | Hidratación de sesión sin cookie, login y logout |
| `formatters.test.ts` | 5 | formatPrice (0, decimal, entero) y formatDate |
| `EventCard.test.tsx` | 3 | Que renderiza título, muestra "Gratuito" y enlaza al evento |
| `ImageUploader.test.tsx` | 4 | Renderizado inicial, rechazo por tamaño, subida exitosa y preview |
| `LoginPage.test.tsx` | 2 | Que submit llama a login y navega; que si falla no navega |
| `EventsPage.test.tsx` | 2 | Lista de eventos y EmptyState sin resultados |
| `EventDetailPage.test.tsx` | 3 | Título del evento, enlace de login sin auth, botón de reserva con auth |
| `UserDashboardPage.test.tsx` | 2 | Título de la página y EmptyState en tabla vacía |
| `DataTable.test.tsx` | 4 | Renderizado de filas, ordenación, EmptyState y filtro global |
| `DateRangePicker.test.tsx` | 3 | Placeholder, apertura del calendario y llamada a onChange |
| `useFetch.test.ts` | 2 | Happy path y error path |

---

## Qué NO testeo (y por qué)

- **Estilos y colores**: no tienen comportamiento, no se pueden romper con un refactor de lógica
- **Componentes de shadcn/ui y Radix**: son librerías de terceros con sus propios tests, no me toca a mí
- **Lo que TypeScript ya valida**: si el tipo no permite un valor, no escribo un test para comprobarlo
- **Snapshots**: se rompen con cualquier cambio cosmético y dan falsa sensación de seguridad
- **Rutas de React Router**: la navegación declarativa funciona; lo que testeo son las condiciones y las llamadas a servicios
- **Casos imposibles**: no valido entradas que TypeScript impide en tiempo de compilación

---

## Cómo correr los tests

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

Los tests de backend necesitan PostgreSQL corriendo (usan la BD real, no mocks). Cada test crea y limpia sus propios datos con emails del dominio `@convoca.test`, así no interfieren con el seed ni entre ellos.

---

## Cómo añadir un test nuevo

**Backend:** decide el fichero según el módulo, crea los datos que necesites vía API o directamente con Prisma, y limpia al final. Cada test tiene que ser independiente — nunca dependas del estado que dejó otro test.

**Frontend:** usa `vi.mock` para aislar servicios externos. Aserta comportamiento (`getByRole`, `getByText`), no estructura DOM.

---

## Cobertura objetivo

| Módulo | Objetivo |
|---|---|
| Contextos (reducers + hooks) | ≥ 60% |
| lib/formatters.ts | 100% (es lógica pura) |
| hooks/useFetch.ts | ≥ 70% |
| Componentes visuales puros | Sin objetivo |

No busco 100% global. Un test que solo comprueba que un componente se monta sin crashear no me dice nada útil y me hace ruido cuando hago refactors legítimos.
