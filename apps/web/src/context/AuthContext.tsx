import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import type { Role, User } from '@convoca/shared';
import { type ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';

// ── State & Actions ─────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type State = {
  status: Status;
  user: User | null;
  error: string | null;
};

type Action =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

// Exported for unit testing
export function authReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, status: 'loading', error: null };
    case 'AUTH_SUCCESS':
      return { status: 'authenticated', user: action.payload, error: null };
    case 'AUTH_FAILURE':
      return { status: 'unauthenticated', user: null, error: action.payload };
    case 'LOGOUT':
      return { status: 'unauthenticated', user: null, error: null };
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

type AuthContextValue = {
  status: Status;
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    status: 'idle',
    user: null,
    error: null,
  });

  // ToastProvider sits above AuthProvider in the tree, so this is safe
  const { toast } = useToast();

  // Hydrate session on mount — api.ts handles the refresh retry transparently
  useEffect(() => {
    dispatch({ type: 'AUTH_START' });
    authService
      .getMe()
      .then(({ user }) => dispatch({ type: 'AUTH_SUCCESS', payload: user }))
      .catch(() => dispatch({ type: 'AUTH_FAILURE', payload: '' }));
  }, []); // intentionally empty — runs once on mount

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const { user } = await authService.login({ email, password });
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        toast.success(`¡Bienvenido, ${user.name}!`);
      } catch (err) {
        const apiErr = err as ApiError;
        const message = apiErr.error ?? 'Error al iniciar sesión';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        toast.error(message);
        throw err;
      }
    },
    [toast],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const { user } = await authService.register({ email, password, name });
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        toast.success(`¡Cuenta creada! Bienvenido, ${user.name}`);
      } catch (err) {
        const apiErr = err as ApiError;
        const message = apiErr.error ?? 'Error al registrarse';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        toast.error(message);
        throw err;
      }
    },
    [toast],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => state.user !== null && roles.includes(state.user.role),
    [state.user],
  );

  return (
    <AuthContext.Provider
      value={{
        status: state.status,
        user: state.user,
        error: state.error,
        isAuthenticated: state.status === 'authenticated',
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
