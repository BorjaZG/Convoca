# Uso de IA en el desarrollo de Convoca

---

## Herramientas que he usado

- **Claude (Anthropic) — chat**: para planificar la arquitectura del proyecto, resolver dudas técnicas, preparar prompts y validar decisiones de diseño antes de implementarlas.
- **Claude Code**: para generar código según directamente en el proyecto según las necesidades que se me iban planteando.

---

## En qué fases usé IA

**Fase 0 — Bootstrap**: usé Claude chat para diseñar la estructura del monorepo con pnpm workspaces y definir el schema de Prisma. Me ayudó bastante a tener claro qué paquetes iban en cada sitio antes de crear nada. Luego con Claude Code generé toda la configuración inicial (tsconfig, vite, tailwind, docker-compose, etc.).

**Fase 1 — Autenticación JWT**: la parte de auth fue donde más útil me resultó la IA. El flujo de refresh tokens (rotación, revocación, auto-refresh en el frontend) era lo que menos controlaba y me lo explicó paso a paso. También me ayudó a montar el `api.ts` con el interceptor de 401 que reintenta la petición después de hacer refresh.

**Fase 2 — Estado global**: aquí usé la IA sobre todo para tener claro qué debía ir en Context y qué no. Me ayudó a razonar por qué los datos del servidor no deberían ir en Context (porque tienen su propio ciclo de vida con loading/error/refetch) y a montar la composición de providers en el orden correcto.

**Fase 3 — Datos y servicios**: Claude Code generó el CRUD del backend casi entero, pero tuve que revisar cosas. Por ejemplo, me generó los componentes de shadcn pero se olvidó de instalar `class-variance-authority` como dependencia, así que al arrancar Vite petaba. También el wrapper `api.ts` solo tenía `get` y `post` pero los servicios usaban `put`, `patch` y `delete` que no existían — lo pillé porque al testear en navegador las acciones de editar y cancelar no funcionaban.

**Fase 4 — Dashboards**: le pedí que montara los tres dashboards con DataTable, gráficos Recharts y filtros de fechas. Antes de escribir código me hizo 6 preguntas sobre cosas que no encajaban entre el prompt y el código existente (como que los stats del backend no cubrían todo lo que necesitaban los gráficos).

**Fase 5 — Testing**: aquí fue donde más cuidado tuve con lo que generaba. Me propuso usar MSW (Mock Service Worker) pero decidí seguir con `vi.mock` que era el patrón que ya tenía establecido. También encontró que un test existente tenía el nombre engañoso (decía que probaba el borrado exitoso pero en realidad probaba el 403) y lo corrigió.

**Fase 7 — Cloudinary**: me ayudó a entender el patrón de firma server-side. Yo pensaba que el archivo tenía que pasar por mi backend, pero me explicó que lo correcto es que el backend solo firme y el frontend suba directamente a Cloudinary. Así el servidor no gasta ancho de banda con archivos grandes.

---

## Prompts y decisiones importantes

### 1. Cookies httpOnly vs localStorage

**Qué problema tenía**: no tenía claro dónde guardar los tokens JWT. En tutoriales siempre veo localStorage, pero sabía que tenía problemas de seguridad.

**Qué hice**: le pregunté las ventajas e inconvenientes de cada opción y cuál era más defendible para la asignatura.

**Qué salió**: me recomendó cookies httpOnly porque son inaccesibles desde JavaScript (protege contra XSS). El coste es que hay que configurar CORS con `credentials: true` y gestionar `sameSite`, pero para el tutor es mucho más defendible que localStorage. Eso condicionó toda la arquitectura de auth.

### 2. Context API vs Redux

**Qué problema tenía**: el enunciado habla de "gestión de estado global" y "patrón basado en reducer".

**Qué hice**: le pregunté si Context + useReducer era suficiente o si necesitaba Redux.

**Qué salió**: me explicó que para tres dominios independientes (sesión, tema, toasts) Redux era desproporcionado. El enunciado dice "un patrón basado en reducer" y useReducer cumple eso perfectamente. Me ayudó a escribir el documento `state-management.md` donde justifico la decisión, que es lo que el tutor quiere ver.

### 3. Estructura de la capa de servicios

**Qué problema tenía**: en la AA1 hacía fetch directamente desde los componentes y el tutor lo penalizó. Necesitaba una forma limpia de separarlo.

**Qué hice**: le pedí que me montara una arquitectura donde ningún componente toque fetch directamente.

**Qué salió**: la cadena componente → hook → servicio → api.ts. El hook `useFetch` es genérico y gestiona loading/error/data. Los servicios (`eventsService`, `reservationsService`...) encapsulan las URLs y los tipos. Verifico que no haya fetch fuera de servicios con `grep -r "fetch(" apps/web/src/components/` — si devuelve algo, está mal.

### 4. Bug de la paginación

**Qué problema tenía**: al testear la lista de eventos en el navegador, el botón de "Página siguiente" no hacía nada. La lista se quedaba siempre en la primera página.

**Qué hice**: le expliqué el síntoma exacto y le pedí que investigara el componente de paginación y el hook que gestionaba el estado.

**Qué salió**: encontró que el handler del botón actualizaba el estado de `page` pero el hook `useEvents` no tenía `page` en su array de dependencias, así que el cambio de página no disparaba un nuevo fetch. Lo arregló añadiendo la dependencia y funcionó al momento. Este es un buen ejemplo de uso correcto de la IA: yo identifiqué el problema testeando a mano, la IA encontró la causa raíz rápido y me dio la solución concreta.

---

## Qué rechacé o modifiqué

- **MSW**: en la fase 5, Claude Code me propuso instalar Mock Service Worker para los tests de frontend. Decidí no hacerlo porque ya tenía el patrón de `vi.mock` establecido en los tests de fases anteriores y cambiar a mitad habría sido inconsistente. El tutor no va a valorar más una librería que otra si los tests cubren lo mismo.

- **Dependencias olvidadas**: Claude Code generó los componentes de shadcn/ui (button, alert, label) pero no instaló `class-variance-authority`, que es la dependencia que usan internamente. Vite me petó al arrancar y tuve que instalarla yo a mano. Esto me enseñó a no confiar ciegamente en lo que genera — siempre hay que arrancar y probar.

- **Bug de las entradas**: después de que Claude Code generara el sistema de reservas, al testear descubrí que al reservar entradas no se restaba la capacidad disponible del evento. El endpoint devolvía 201 (creado correctamente) pero la capacidad seguía igual. Tuve que hacer un hotfix para que el servicio de reservas actualizara el campo de capacidad al crear y al cancelar una reserva.

- **Métodos HTTP faltantes en api.ts**: el wrapper solo tenía `get` y `post`, pero los servicios del frontend llamaban a `api.put`, `api.patch` y `api.delete`. No daba error de TypeScript porque eran propiedades de un objeto, simplemente eran `undefined` y fallaba silenciosamente. Lo pillé al intentar editar un evento desde el navegador.

- **Formato de errores**: la auditoría de la fase 3 reveló que el backend devolvía `{ error: string }` cuando el spec pedía `{ error: { code, message } }`. Decidí corregirlo porque es el tipo de detalle que el tutor puede preguntar en la defensa.

---

## Qué he aprendido

La IA me ha resultado más útil para dos cosas: **explicar conceptos que no dominaba** (refresh tokens, firma de Cloudinary, composición de contextos) y **generar boilerplate repetitivo** (CRUD de endpoints, configuración de herramientas, estructura de tests). Para eso ahorra mucho tiempo.

Donde peor funciona es cuando le dejas hacer todo sin supervisar. Cada vez que he confiado sin probar lo que generaba, he acabado con bugs que me costaba encontrar después (la paginación, las entradas, las dependencias). La lección es clara: la IA genera rápido pero no testea, y la responsabilidad de que funcione es mía.

También he aprendido que darle contexto claro marca toda la diferencia. Cuando le pasaba un prompt vago ("hazme el dashboard"), el resultado era genérico. Cuando le explicaba exactamente qué tenía, qué quería y qué restricciones había, el código salía mucho más encajado con el proyecto.

Si volviera a empezar, lo que haría diferente es dedicar más tiempo a entender cada pieza antes de pasar a la siguiente fase. Hubo momentos donde acepté código que funcionaba pero que no entendía del todo, y al llegar a la fase de testing me di cuenta de que no sabía bien qué estaba testeando. La regla del tutor tiene razón: si no sabes explicarlo, no está bien hecho.