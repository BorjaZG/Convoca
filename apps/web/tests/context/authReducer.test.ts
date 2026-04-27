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

const idle = { status: 'idle' as const, user: null, error: null };

describe('authReducer', () => {
  it('AUTH_START: activa loading y limpia el error previo', () => {
    const next = authReducer(
      { status: 'unauthenticated', user: null, error: 'error previo' },
      { type: 'AUTH_START' },
    );
    expect(next.status).toBe('loading');
    expect(next.error).toBeNull();
    expect(next.user).toBeNull();
  });

  it('AUTH_START: preserva el usuario en memoria mientras recarga', () => {
    const next = authReducer(
      { status: 'authenticated', user, error: null },
      { type: 'AUTH_START' },
    );
    expect(next.status).toBe('loading');
    expect(next.user).toBe(user);
  });

  it('AUTH_SUCCESS: establece authenticated + usuario', () => {
    const next = authReducer(idle, { type: 'AUTH_SUCCESS', payload: user });
    expect(next.status).toBe('authenticated');
    expect(next.user).toBe(user);
    expect(next.error).toBeNull();
  });

  it('AUTH_FAILURE: establece unauthenticated + error', () => {
    const next = authReducer(idle, { type: 'AUTH_FAILURE', payload: 'Credenciales inválidas' });
    expect(next.status).toBe('unauthenticated');
    expect(next.user).toBeNull();
    expect(next.error).toBe('Credenciales inválidas');
  });

  it('AUTH_FAILURE: limpia el usuario autenticado previo', () => {
    const next = authReducer(
      { status: 'authenticated', user, error: null },
      { type: 'AUTH_FAILURE', payload: 'Token expirado' },
    );
    expect(next.user).toBeNull();
    expect(next.status).toBe('unauthenticated');
  });

  it('LOGOUT: limpia usuario y error', () => {
    const next = authReducer({ status: 'authenticated', user, error: null }, { type: 'LOGOUT' });
    expect(next.status).toBe('unauthenticated');
    expect(next.user).toBeNull();
    expect(next.error).toBeNull();
  });
});
