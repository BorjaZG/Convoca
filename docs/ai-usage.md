# Uso de IA en el desarrollo de Convoca

## Herramientas que he usado

- **Claude (Anthropic) — chat**: para planificar la arquitectura, resolver dudas técnicas y tomar decisiones de diseño antes de implementar.
- **Claude Code**: para generar código directamente en el proyecto según las necesidades de cada fase.

---

## En qué fases usé IA

**Fase 0 — Bootstrap**: usé Claude chat para diseñar la estructura del monorepo y definir el schema de Prisma. Me ayudó a tener claro qué iba en cada paquete antes de crear nada. Con Claude Code generé la configuración inicial (tsconfig, vite, tailwind, docker-compose...).

**Fase 1 — Autenticación JWT**: fue donde más útil me resultó. El flujo de refresh tokens (rotación, revocación, auto-refresh en el frontend) era lo que menos controlaba y me lo explicó paso a paso. También me ayudó a montar `api.ts` con el interceptor de 401.

**Fase 2 — Estado global**: lo usé para aclarar qué debía ir en Context y qué no. Me ayudó a entender por qué los datos del servidor no deben ir en Context (tienen su propio ciclo de vida: loading, error, refetch) y a montar los providers en el orden correcto.

**Fase 3 — Datos y servicios**: Claude Code generó el CRUD del backend casi entero, pero tuve que revisar cosas. Por ejemplo, generó los componentes de shadcn pero se olvidó de instalar `class-variance-authority`, así que Vite petaba al arrancar. También el wrapper `api.ts` solo tenía `get` y `post`, pero los servicios usaban `put`, `patch` y `delete` que no existían — lo pillé al probar editar un evento en el navegador.

**Fase 4 — Dashboards**: le pedí los tres dashboards con DataTable, gráficos Recharts y filtros de fechas. Antes de escribir código me hizo varias preguntas sobre inconsistencias entre el prompt y el código existente (los stats del backend no cubrían todo lo que necesitaban los gráficos).

**Fase 5 — Testing**: me propuso usar MSW (Mock Service Worker) pero decidí seguir con `vi.mock` que era el patrón que ya tenía. También encontró que un test tenía el nombre engañoso — decía que probaba el borrado exitoso pero en realidad probaba el 403 — y lo corrigió.

**Fase 7 — Cloudinary**: me ayudó a entender el patrón de firma server-side. Yo pensaba que el archivo tenía que pasar por mi backend, pero me explicó que lo correcto es que el backend solo firme y el frontend suba directamente. Así el servidor no gasta ancho de banda con archivos grandes.

---

## Decisiones importantes que tomé con ayuda de la IA

### Cookies httpOnly vs localStorage

No tenía claro dónde guardar los JWT. Le pregunté las ventajas e inconvenientes de cada opción.

Me recomendó cookies httpOnly porque JavaScript no puede leerlas (protege contra XSS). El coste es configurar CORS con `credentials: true` y gestionar `sameSite`, pero es mucho más defendible que localStorage. Eso condicionó toda la arquitectura de auth.

### Context API vs Redux

Le pregunté si Context + useReducer era suficiente o necesitaba Redux para el enunciado.

Me explicó que para tres dominios independientes (sesión, tema, toasts) Redux es desproporcionado. El enunciado pide "un patrón basado en reducer" y useReducer cumple eso. Me ayudó a escribir `state-management.md` donde justifico la decisión.

### La capa de servicios

En proyectos anteriores hacía fetch directamente desde los componentes y lo penalizaron. Le pedí una arquitectura donde ningún componente tocase fetch.

Salió la cadena componente → hook → servicio → api.ts. El hook `useFetch` es genérico y gestiona loading/error/data. Los servicios encapsulan las URLs. Para verificar que no hay fetch fuera de servicios puedo usar `grep -r "fetch(" apps/web/src/components/` — si devuelve algo, está mal.

### Bug de la paginación

El botón de "Página siguiente" no hacía nada. La lista siempre se quedaba en la primera página.

Encontró que el handler actualizaba el estado de `page` pero el hook `useEvents` no tenía `page` en su array de dependencias, así que el cambio no disparaba un nuevo fetch. Lo arregló añadiendo la dependencia.

---

## Qué rechacé o tuve que corregir

- **MSW**: en la fase de testing me propuso Mock Service Worker. No lo usé porque ya tenía el patrón de `vi.mock` establecido y cambiar a mitad habría sido inconsistente.

- **Dependencias olvidadas**: generó los componentes de shadcn/ui sin instalar `class-variance-authority`. Vite petó al arrancar y tuve que instalarla yo.

- **Capacidad no se actualizaba**: al reservar entradas el endpoint devolvía 201 pero la capacidad del evento no cambiaba. Tuve que hacer un hotfix para que el servicio de reservas actualizara el campo al crear y al cancelar.

- **Métodos HTTP faltantes**: `api.ts` solo tenía `get` y `post`, pero los servicios llamaban a `api.put`, `api.patch` y `api.delete`. No daba error de TypeScript, simplemente eran `undefined` y fallaba silenciosamente.

---

## Lo que he aprendido

La IA me ha resultado útil para dos cosas: **explicar conceptos que no dominaba** (refresh tokens, firma de Cloudinary, composición de contextos) y **generar boilerplate repetitivo** (CRUD de endpoints, configuración de herramientas).

Donde peor funciona es cuando lo dejas hacer todo sin supervisar. Cada vez que confié sin probar lo que generaba, acabé con bugs que costaba encontrar. La lección es clara: genera rápido pero no testea, y la responsabilidad de que funcione es mía.

También he aprendido que darle contexto concreto marca toda la diferencia. Con prompts vagos el resultado era genérico. Con el código existente y las restricciones claras, el resultado encajaba mucho mejor.
