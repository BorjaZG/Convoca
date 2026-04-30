# Gestión de estado — Convoca

## La regla que sigo

El estado vive donde tenga la vida más corta posible. Si algo solo le importa a un componente, es estado local. Si lo necesitan varios componentes que no están en la misma rama del árbol, es global. Si viene del servidor, no va a Context.

---

## Qué va dónde y por qué

| Estado | Mecanismo | Dónde vive | Por qué ahí |
|---|---|---|---|
| Sesión del usuario | `useReducer` + Context | `AuthContext` | Muchos sitios necesitan saber si hay sesión y quién es el usuario |
| Tema visual (dark/light) | `useState` + Context | `ThemeContext` | Afecta a toda la UI y se persiste en localStorage |
| Toasts (notificaciones) | `useReducer` + Context | `ToastContext` | Cualquier parte de la app puede disparar un toast, incluso otro Context |
| Valores de formulario | `react-hook-form` | Local al componente | Cambian con cada tecla, si fueran globales re-renderizarían todo |
| Filtros y paginación | `useState` | Local a la página | Solo interesan a esa vista concreta |
| Eventos, reservas, reseñas... | Hooks con `useFetch` | `useEvents`, `useReservations`... | Son datos del servidor con su propio ciclo (loading, error, refetch) |

---

## Por qué no uso Redux

Redux mete mucho boilerplate: actions, action creators, reducers, selectors, middleware, store... Todo eso tiene sentido cuando tienes un estado global complejo con muchas interacciones cruzadas. En Convoca el estado global son tres cosas independientes (sesión, tema, toasts). Context + useReducer lo resuelve sin dependencias externas.

Si algún día la app creciera mucho (más de 5-6 contextos que interactúan entre sí), migraría a Zustand que es más ligero. Pero la API de los hooks (`useAuth`, `useToast`, `useTheme`) no cambiaría para los consumidores, así que la migración sería fácil.

---

## Por qué no hago un solo Context gigante

```tsx
// ❌ Esto está mal
const AppContext = createContext({ user, theme, toasts, events, filters, ... });
```

Si meto todo en un solo Context, cada vez que aparece un toast se re-renderiza toda la app, incluyendo componentes que solo necesitan el tema. Con tres contextos separados, cada consumidor solo reacciona a lo que le importa:

```tsx
<ThemeProvider>      {/* solo re-renderiza cuando cambia el tema */}
  <ToastProvider>    {/* solo re-renderiza cuando aparece/desaparece un toast */}
    <AuthProvider>   {/* solo re-renderiza cuando cambia la sesión */}
      <App />
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

---

## Por qué los datos del servidor NO van a Context

Los datos remotos (eventos, reservas, reseñas) tienen necesidades que Context no cubre bien: revalidación automática, deduplicación de peticiones, cache, mostrar datos viejos mientras carga los nuevos...

Montar todo eso a mano sobre Context sería reinventar React Query. En su lugar, cada módulo tiene su hook propio (`useEvents`, `useEvent`, `useReservations`, `useStats`) construido sobre el hook genérico `useFetch`, que gestiona loading/error/data sin necesidad de librerías externas de cache.

---

## Cómo se componen los contextos

Un ejemplo real: `AuthContext` usa `ToastContext` directamente para mostrar notificaciones cuando el login funciona o falla:

```tsx
// Dentro de AuthProvider
const { toast } = useToast();

const login = async (email, password) => {
  try {
    const { user } = await authService.login({ email, password });
    dispatch({ type: 'AUTH_SUCCESS', payload: user });
    toast.success(`¡Bienvenido, ${user.name}!`);
  } catch (err) {
    toast.error(err.error ?? 'Error al iniciar sesión');
    throw err;
  }
};
```

La `LoginPage` no sabe cómo se muestra el error — solo llama a `login()` y navega si tiene éxito. El toast lo gestiona el contexto por debajo.

---

## Orden de los providers en main.tsx

```
ThemeProvider         ← el más externo, no depende de nadie
  ToastProvider       ← por encima de Auth para que Auth pueda usarlo
    AuthProvider      ← el más interno, depende de Toast
      BrowserRouter
        Routes
```

El orden importa: AuthProvider necesita llamar a `useToast()`, así que ToastProvider tiene que estar por encima.