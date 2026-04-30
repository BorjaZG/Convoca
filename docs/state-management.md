# Gestión de estado en Convoca

## Regla fundamental

> **Un estado vive donde tiene la vida más corta posible.**

Esto no es una máxima filosófica; es una regla operativa para evitar re-renders innecesarios, testing complicado y acoplamiento entre partes de la app que no deberían saber la una de la otra.

---

## Tabla de decisión: qué va dónde y por qué

| Estado | Mecanismo | Dónde vive | Razón |
|---|---|---|---|
| Sesión del usuario (user, status) | `useReducer` + Context | `AuthContext` | Múltiples partes de la UI necesitan saber si hay sesión y quién es el usuario. Cambios poco frecuentes. |
| Tema visual (light/dark) | `useState` + Context | `ThemeContext` | Persiste entre recargas (localStorage), afecta a toda la UI vía clase en `<html>`. |
| Notificaciones toast | `useReducer` + Context | `ToastContext` | Cualquier capa (incluido otro Context) puede disparar un toast sin acoplar UI al componente que lanza la acción. |
| Valores de formulario | `react-hook-form` | Local al componente | Mutan con cada tecla; si fueran globales provocarían re-renders en toda la app. |
| Filtros / paginación de listas | `useState` local | Local al componente de lista | Solo interesan a esa vista. No hay razón para compartirlos. |
| Eventos, reservas, reseñas | Hooks custom con `useFetch` | `useEvents`, `useEvent`, `useReservations`, `useStats` | Son datos del servidor, tienen su propio ciclo de vida (loading, error, refetch). Context es el mecanismo equivocado para esto. |

---

## Por qué **no** usamos Redux ni Zustand

**Redux** añade boilerplate (actions, action creators, selectors, middleware) que solo compensa cuando:
- Hay lógica de negocio compleja que debe testearse en aislamiento del DOM.
- El estado se comparte entre rutas con ciclos de vida completamente distintos.
- Se necesita time-travel debugging en producción.

Nada de lo anterior aplica a Convoca en su alcance actual. El estado global se reduce a sesión + tema + toasts; tres contextos independientes con useReducer/useState bastan.

**Zustand** es más ligero que Redux, pero sigue siendo una dependencia externa para un problema que Context API resuelve sin coste. La regla: añadir una dependencia cuando Context + useReducer resulta insuficiente, no antes.

---

## Por qué **no** hacemos un MegaContext

```tsx
// ❌ Anti-patrón: un contexto con todo dentro
const AppContext = createContext({ user, theme, toasts, events, filters, ... });
```

Un consumidor que solo necesita el tema (`useTheme`) se re-renderizaría cada vez que cambia un toast, un filtro o se hidrata la sesión. Tres contextos separados garantizan que cada consumidor solo reacciona a lo que le importa:

```tsx
// ✓ Tres contextos independientes
<ThemeProvider>   // re-renderiza solo cuando cambia el tema
  <ToastProvider> // re-renderiza solo cuando aparece/desaparece un toast
    <AuthProvider>// re-renderiza solo cuando cambia la sesión
      <App />
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

---

## Por qué **no** metemos datos del servidor en Context

Los datos remotos tienen necesidades que Context no cubre:
- **Revalidación automática** cuando la ventana vuelve al foco.
- **Deduplicación** de peticiones concurrentes.
- **Cache compartida** entre componentes que piden el mismo recurso.
- **Stale-while-revalidate**: mostrar datos viejos mientras llega la respuesta fresca.

Implementar todo eso manualmente sobre Context es reinventar SWR o React Query. En su lugar, cada módulo tiene un hook de fetching propio (`useEvents`, `useEvent`, `useReservations`, `useStats`…) construido sobre el hook genérico `useFetch`, que gestiona su propio ciclo de vida sin depender de ninguna librería externa de cache.

---

## Composición de contextos: ejemplo real

`AuthContext` usa `ToastContext` directamente, demostrando que los contextos pueden componerse sin acoplar la UI:

```tsx
// src/context/AuthContext.tsx
export function AuthProvider({ children }) {
  const { toast } = useToast(); // ToastProvider está por encima → legal

  const login = async (email, password) => {
    try {
      const { user } = await authService.login({ email, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      toast.success(`¡Bienvenido, ${user.name}!`); // ← notificación global
    } catch (err) {
      toast.error(err.error ?? 'Error al iniciar sesión'); // ← la página no necesita gestionar el error
      throw err; // la página aún puede reaccionar (p.e. para no navegar)
    }
  };
}
```

La `LoginPage` no sabe cómo se muestra el error; solo llama a `login()` y navega si tiene éxito.

---

## Árbol de providers (main.tsx)

```
ThemeProvider         ← más externo porque no depende de nada
  ToastProvider       ← por encima de Auth para que Auth pueda usarlo
    AuthProvider      ← más interno porque depende de Toast
      BrowserRouter   ← en App.tsx
        Routes        ← en AppRouter.tsx
```

---

## Cuándo sí tendría sentido añadir Zustand

- Más de 5-6 contextos con interacciones cruzadas frecuentes.
- Necesidad de acceder al estado fuera del árbol de React (p.e. desde un worker o un interceptor de Axios).
- Optimizaciones de rendimiento donde `useMemo`/`useCallback` ya no son suficientes.

Si llegamos a ese punto, la migración es directa: la API de los hooks (`useAuth`, `useToast`, `useTheme`) no cambia desde el punto de vista de los consumidores.
