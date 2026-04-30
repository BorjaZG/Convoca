import { createContext, useCallback, useContext, useReducer, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastState = { toasts: Toast[] };

type ToastAction =
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string };

// ── Reducer (exported for testing) ───────────────────────────────────────────

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { toasts: state.toasts.filter(t => t.id !== action.payload) };
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? DEFAULT_DURATION;
    dispatch({ type: 'ADD_TOAST', payload: { ...toast, id, duration } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

type ToastHelpers = {
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
};

export function useToast(): {
  toast: ToastHelpers;
  dismiss: (id: string) => void;
  toasts: Toast[];
} {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');

  const toast: ToastHelpers = {
    success: (message, duration) =>
      ctx.addToast({ type: 'success', message, duration: duration ?? DEFAULT_DURATION }),
    error: (message, duration) =>
      ctx.addToast({ type: 'error', message, duration: duration ?? DEFAULT_DURATION }),
    info: (message, duration) =>
      ctx.addToast({ type: 'info', message, duration: duration ?? DEFAULT_DURATION }),
  };

  return { toast, dismiss: ctx.dismiss, toasts: ctx.toasts };
}
