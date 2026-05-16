import { describe, expect, it } from 'vitest';
import { authReducer } from '@/context/AuthContext';
import type { User } from '@convoca/shared';

const user: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('authReducer', () => {
  it('AUTH_SUCCESS: establece authenticated y el usuario', () => {
    const state = { status: 'idle' as const, user: null, error: null };
    const next = authReducer(state, { type: 'AUTH_SUCCESS', payload: user });
    expect(next.status).toBe('authenticated');
    expect(next.user).toBe(user);
  });

  it('AUTH_FAILURE: establece unauthenticated y el error', () => {
    const state = { status: 'idle' as const, user: null, error: null };
    const next = authReducer(state, { type: 'AUTH_FAILURE', payload: 'Credenciales inválidas' });
    expect(next.status).toBe('unauthenticated');
    expect(next.error).toBe('Credenciales inválidas');
    expect(next.user).toBeNull();
  });

  it('LOGOUT: limpia el usuario y vuelve a unauthenticated', () => {
    const state = { status: 'authenticated' as const, user, error: null };
    const next = authReducer(state, { type: 'LOGOUT' });
    expect(next.status).toBe('unauthenticated');
    expect(next.user).toBeNull();
  });

  it('AUTH_START: activa loading', () => {
    const state = { status: 'unauthenticated' as const, user: null, error: null };
    const next = authReducer(state, { type: 'AUTH_START' });
    expect(next.status).toBe('loading');
  });
});
