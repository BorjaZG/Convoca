# Gestión de estado — Convoca

## La regla que sigo

El estado vive donde tenga la vida más corta posible. Si solo lo necesita un componente, es local. Si lo necesitan varios componentes que no están relacionados, es global. Si viene del servidor, no va a Context.

---

## Qué va dónde

| Estado | Mecanismo | Dónde vive |
|---|---|---|
| Sesión del usuario | `useReducer` + Context | `AuthContext` |
| Tema visual (dark/light) | `useState` + Context | `ThemeContext` |
| Toasts (notificaciones) | `useReducer` + Context | `ToastContext` |
| Valores de formulario | `react-hook-form` | Local al componente |
| Filtros y paginación | `useState` | Local a la página |
| Eventos, reservas, reseñas... | Hooks con `useFetch` | `useEvents`, `useReservations`... |

---

## Por qué no uso Redux

Redux tiene mucho boilerplate: actions, reducers, selectors, store, middleware... Tiene sentido cuando el estado global es complejo y con muchas interacciones. En Convoca el estado global son tres cosas independientes. Context + useReducer lo resuelve sin dependencias externas.

---

## Por qué no hago un solo Context

Si meto todo en un solo Context, cuando aparece un toast se re-renderiza toda la app aunque el componente solo necesite el tema. Con contextos separados, cada consumidor solo reacciona a lo que le importa:

```tsx
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

---

## Por qué los datos del servidor no van a Context

Los datos remotos tienen necesidades que Context no cubre bien: revalidación, loading/error, refetch al cambiar filtros...

Cada módulo tiene su hook propio (`useEvents`, `useReservations`, `useStats`...) construido sobre el hook genérico `useFetch`, que gestiona loading/error/data sin librerías externas.

---

## Cómo se relacionan los contextos

`AuthContext` usa `ToastContext` para mostrar notificaciones cuando el login funciona o falla:

```tsx
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

La `LoginPage` no sabe cómo se muestra el error — solo llama a `login()` y navega si tiene éxito.

---

## Orden de los providers

```
ThemeProvider         ← el más externo, no depende de nadie
  ToastProvider       ← por encima de Auth para que Auth pueda usarlo
    AuthProvider      ← depende de Toast
      BrowserRouter
        Routes
```

El orden importa: `AuthProvider` necesita llamar a `useToast()`, así que `ToastProvider` tiene que estar por encima.
