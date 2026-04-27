import { describe, expect, it } from 'vitest';
import { toastReducer, type Toast } from '@/context/ToastContext';

const makeToast = (overrides: Partial<Toast> = {}): Toast => ({
  id: 'toast-1',
  type: 'info',
  message: 'Mensaje de prueba',
  duration: 4000,
  ...overrides,
});

describe('toastReducer', () => {
  it('ADD_TOAST: añade un toast a la lista vacía', () => {
    const toast = makeToast();
    const next = toastReducer({ toasts: [] }, { type: 'ADD_TOAST', payload: toast });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0]).toBe(toast);
  });

  it('ADD_TOAST: añade al final sin mutar los anteriores', () => {
    const first = makeToast({ id: 'a' });
    const second = makeToast({ id: 'b', type: 'success' });
    const next = toastReducer({ toasts: [first] }, { type: 'ADD_TOAST', payload: second });
    expect(next.toasts).toHaveLength(2);
    expect(next.toasts[0]).toBe(first);
    expect(next.toasts[1]).toBe(second);
  });

  it('ADD_TOAST: preserva el orden de inserción', () => {
    const toasts = [
      makeToast({ id: '1' }),
      makeToast({ id: '2', type: 'error' }),
      makeToast({ id: '3', type: 'success' }),
    ];
    let state = { toasts: [] as Toast[] };
    for (const t of toasts) {
      state = toastReducer(state, { type: 'ADD_TOAST', payload: t });
    }
    expect(state.toasts.map((t) => t.id)).toEqual(['1', '2', '3']);
  });

  it('REMOVE_TOAST: elimina el toast con el id indicado', () => {
    const a = makeToast({ id: 'a' });
    const b = makeToast({ id: 'b' });
    const next = toastReducer({ toasts: [a, b] }, { type: 'REMOVE_TOAST', payload: 'a' });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('b');
  });

  it('REMOVE_TOAST: no modifica la lista si el id no existe', () => {
    const toast = makeToast({ id: 'real' });
    const next = toastReducer(
      { toasts: [toast] },
      { type: 'REMOVE_TOAST', payload: 'inexistente' },
    );
    expect(next.toasts).toHaveLength(1);
  });

  it('REMOVE_TOAST: deja la lista vacía si era el único toast', () => {
    const toast = makeToast();
    const next = toastReducer({ toasts: [toast] }, { type: 'REMOVE_TOAST', payload: toast.id });
    expect(next.toasts).toHaveLength(0);
  });
});
