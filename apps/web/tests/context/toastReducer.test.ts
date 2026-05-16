import { describe, expect, it } from 'vitest';
import { toastReducer, type Toast } from '@/context/ToastContext';

const toast: Toast = {
  id: 'toast-1',
  type: 'info',
  message: 'Mensaje de prueba',
  duration: 4000,
};

describe('toastReducer', () => {
  it('ADD_TOAST: añade un toast a la lista', () => {
    const next = toastReducer({ toasts: [] }, { type: 'ADD_TOAST', payload: toast });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('toast-1');
  });

  it('REMOVE_TOAST: elimina el toast con el id indicado', () => {
    const other: Toast = { id: 'toast-2', type: 'success', message: 'Otro', duration: 3000 };
    const state = { toasts: [toast, other] };
    const next = toastReducer(state, { type: 'REMOVE_TOAST', payload: 'toast-1' });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('toast-2');
  });

  it('REMOVE_TOAST: no hace nada si el id no existe', () => {
    const state = { toasts: [toast] };
    const next = toastReducer(state, { type: 'REMOVE_TOAST', payload: 'inexistente' });
    expect(next.toasts).toHaveLength(1);
  });
});
