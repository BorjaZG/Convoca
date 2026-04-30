# Estrategia de testing — Convoca

## Filosofía

Para cada test me hago la misma pregunta: "si esto se rompe, ¿se cae algo importante?". Si la respuesta es no, no escribo el test. Prefiero 116 tests que cubran cosas reales que 500 tests de relleno.

La suite tiene **116 tests** en total: 47 en backend y 68 en frontend (sin contar los de E2E, que van aparte).

---

## Qué se testea en el backend

| Fichero | Tests | Qué protege |
|---|---|---|
| `auth.test.ts` | 9 | El flujo de autenticación entero: registro, login, refresh, logout |
| `events.test.ts` | 13 | Que solo se ven eventos PUBLISHED, que los filtros funcionan, que no puedes editar eventos ajenos, que el soft delete funciona |
| `reservations.test.ts` | 8 | Que no puedes reservar más de la capacidad disponible, que cancelar libera plazas, que no puedes ver reservas de eventos de otros |
| `reviews.test.ts` | 9 | Que necesitas haber asistido para reseñar, que no puedes reseñar dos veces, que solo el autor o admin puede borrar |
| `stats.test.ts` | 3 | Que cada rol recibe sus propias estadísticas y no las de otro |
| `upload.test.ts` | 6 | Que el endpoint de firma requiere auth, que devuelve los campos correctos, que nunca expone la API secret |

**¿Por qué tests de integración con Supertest y no tests unitarios de servicios?** Porque los bugs reales aparecen en la integración middleware → controlador → servicio → base de datos. Testear el servicio solo en memoria no habría pillado bugs como el de `requireRole` que devolvía 403 cuando no debía o el soft delete que se comportaba diferente según hubiera reservas confirmadas o no.

---

## Qué se testea en el frontend

| Fichero | Tests | Qué protege |
|---|---|---|
| `authReducer.test.ts` | 6 | Todas las transiciones del ciclo de auth |
| `toastReducer.test.ts` | 6 | Añadir y quitar toasts |
| `useAuth.test.tsx` | 6 | Hidratación de sesión, login, logout, hasRole |
| `formatters.test.ts` | 5 | formatPrice, formatDate, formatDateRange — se usan en varios componentes |
| `EventCard.test.tsx` | 5 | Que renderiza título, fecha, precio y enlace correctamente |
| `ImageUploader.test.tsx` | 9 | Validación de tipo/tamaño, flujo de firma + upload, preview, eliminar, error de red |
| `LoginPage.test.tsx` | 2 | Que submit llama a login y navega; que si falla no navega |
| `EventsPage.test.tsx` | 3 | Loading → lista, EmptyState sin resultados, refetch al cambiar filtro |
| `EventDetailPage.test.tsx` | 3 | Que el botón de reservar se oculta si no estás logueado |
| `UserDashboardPage.test.tsx` | 5 | Que las StatCards muestran los valores del mock, EmptyState en tabla vacía |
| `DataTable.test.tsx` | 8 | Sort por columna, filtro global, skeleton, empty state |
| `DateRangePicker.test.tsx` | 5 | Placeholder, popover, onChange, formato de fecha |
| `useFetch.test.ts` | 3 | Happy path, error path, que aborta al desmontar |

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

**Frontend:** usa `vi.mock` para aislar servicios externos. Para páginas usa el helper `renderWithProviders` que envuelve con Router + Toast + Auth. Aserta comportamiento (`getByRole`, `getByText`), no estructura DOM.

---

## Cobertura objetivo

| Módulo | Objetivo |
|---|---|
| Contextos (reducers + hooks) | ≥ 70% |
| Servicios | ≥ 60% |
| lib/formatters.ts | 100% (es lógica pura) |
| hooks/useFetch.ts | ≥ 80% |
| Componentes visuales puros | Sin objetivo |

No busco 100% global. Un test que solo comprueba que un componente se monta sin crashear no me dice nada útil y me hace ruido cuando hago refactors legítimos.