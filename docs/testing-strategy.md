# Testing Strategy — Convoca

## Principio rector

Cada test responde a la pregunta: _"Si esto se rompe, ¿se cae algo importante?"_. Si la respuesta es no, el test no existe. Calidad sobre cantidad.

La suite actual cuenta con **116 tests** en total: 101 establecidos en la fase 5, más 15 añadidos en la fase 7 con la integración de Cloudinary (6 en backend, 9 en frontend).

---

## Qué se testea y por qué

### Backend (`apps/api/tests/`)

| Fichero                | Tests | Qué protege                                                                                             |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `auth.test.ts`         | 9     | Registro, login, refresh token, logout — el flujo de autenticación completo                             |
| `events.test.ts`       | 13    | Visibilidad (solo PUBLISHED), filtros, autorización por rol/propiedad, soft delete                      |
| `reservations.test.ts` | 8     | Límite de capacidad, validación zod, autorización de acceso a reservas ajenas                           |
| `reviews.test.ts`      | 9     | Requisito de asistencia, unicidad por usuario/evento, borrado solo por autor                            |
| `stats.test.ts`        | 3     | Que cada rol recibe su shape específico y no se mezclan datos entre roles                               |
| `upload.test.ts`       | 6     | Autenticación y autorización del endpoint de firma; campos devueltos; que el API secret nunca se expone |

**Por qué supertest sobre test unitario de servicios**: los bugs reales en esta API aparecen en la integración middleware → controlador → servicio → BD. Testear el servicio aislado en memoria no habría detectado el bug de `requireRole` que retornaba 403 al USER ni el soft delete condicionado a reservas CONFIRMED.

### Frontend (`apps/web/tests/`)

| Fichero                              | Tests | Qué protege                                                                              |
| ------------------------------------ | ----- | ---------------------------------------------------------------------------------------- |
| `context/authReducer.test.ts`        | 6     | Todas las transiciones de estado del ciclo auth                                          |
| `context/toastReducer.test.ts`       | 6     | Añadir y eliminar toasts por id                                                          |
| `context/useAuth.test.tsx`           | 6     | Hidratación, login, logout, hasRole — el hook que consumen todas las páginas protegidas  |
| `lib/formatters.test.ts`             | 5     | `formatPrice`, `formatDate`, `formatDateRange` — usadas en múltiples componentes         |
| `components/EventCard.test.tsx`      | 5     | Renderizado correcto de título, fecha, precio y enlace de detalle                        |
| `components/ImageUploader.test.tsx`  | 9     | Validación de tipo y tamaño, flujo de firma + upload, preview, eliminación, error de red |
| `pages/LoginPage.test.tsx`           | 2     | Que submit llama a `login()` y navega; que un error no navega                            |
| `pages/EventsPage.test.tsx`          | 3     | Loading→lista, EmptyState sin resultados, refetch al cambiar filtro                      |
| `pages/EventDetailPage.test.tsx`     | 3     | Sección de reserva: oculta si no autenticado, visible si autenticado                     |
| `pages/UserDashboardPage.test.tsx`   | 5     | StatCards con valores mock, EmptyState en tabla vacía                                    |
| `dashboard/DataTable.test.tsx`       | 8     | Sort, filtro global, skeleton, empty state                                               |
| `dashboard/DateRangePicker.test.tsx` | 5     | Placeholder, popover, onChange, formato visual                                           |
| `hooks/useFetch.test.ts`             | 3     | Happy path, error path, abort al desmontar                                               |

---

## Qué NO se testea

- **UI puramente visual**: colores, tamaños, animaciones CSS — sin comportamiento.
- **Componentes shadcn/ui y Radix**: son librerías de terceros con sus propios tests.
- **TypeScript como test**: si el tipo ya restringe el valor, no añadimos un test que compruebe que `string` es `string`.
- **Snapshots**: frágiles por naturaleza, se rompen con cualquier cambio cosmético y dan falsa sensación de cobertura.
- **Rutas de React Router**: la navegación declarativa la cubre el router; lo que testeamos son las condiciones de renderizado y las llamadas a servicios.
- **Casos imposibles**: no validamos entradas que el propio TypeScript impide.

---

## Cómo correr los tests

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

El backend necesita la variable `DATABASE_URL` apuntando a una base de datos PostgreSQL accesible. En CI se usa la misma instancia que en desarrollo; los tests crean y limpian sus propios datos con emails únicos del dominio `@convoca.test`.

---

## Cómo añadir un test nuevo

### Backend

1. Decide el fichero según el módulo (`auth`, `events`, `reservations`, `reviews`, `stats`).
2. Si necesitas un usuario con rol específico, regístralo vía API y eleva el rol directamente en BD con `prisma.user.update`.
3. Limpia exactamente lo que creas (no uses `deleteMany` sin `where`).
4. Nunca dependas del estado creado por otro `it` — cada test debe ser autosuficiente.

### Frontend

1. Usa `vi.mock` para aislar el módulo externo (servicio, hook, context).
2. Para páginas completas usa el helper `tests/helpers/renderWithProviders.tsx` o `MemoryRouter` directamente.
3. Aserta comportamiento, no estructura DOM: prefiere `getByRole`, `getByLabelText`, `getByText` sobre `querySelector`.
4. Para hooks aislados usa `renderHook` de `@testing-library/react`.

---

## Cobertura objetivo

| Módulo                            | Objetivo                                             |
| --------------------------------- | ---------------------------------------------------- |
| `src/context/` (reducers + hooks) | ≥ 70%                                                |
| `src/services/`                   | ≥ 60% (cubierto por tests de integración de páginas) |
| `src/lib/formatters.ts`           | 100% (lógica pura, sin dependencias)                 |
| `src/hooks/useFetch.ts`           | ≥ 80%                                                |
| Componentes UI puros              | Sin objetivo — ver "Qué NO se testea"                |

El 100% global no es el objetivo. Un test trivial que solo comprueba que un componente se monta sin crashear no aporta valor y aumenta el ruido cuando hay refactors legítimos.
