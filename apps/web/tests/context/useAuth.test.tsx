import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/authService', () => ({
  authService: {
    getMe: vi.fn().mockRejectedValue({ error: 'No autenticado', status: 401 }),
    login: vi.fn().mockResolvedValue({
      user: {
        id: 'u1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    register: vi.fn().mockResolvedValue({
      user: {
        id: 'u2',
        email: 'new@example.com',
        name: 'New User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    logout: vi.fn().mockResolvedValue({}),
  },
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <AuthProvider>{children}</AuthProvider>
  </ToastProvider>
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('empieza en idle o loading antes de hidratar', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(['idle', 'loading']).toContain(result.current.status);
  });

  it('queda unauthenticated cuando getMe falla (sin cookie)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login() establece authenticated y carga el usuario', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login('test@example.com', 'Password1');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.user?.name).toBe('Test User');
  });

  it('login() transiciona idle→unauthenticated→authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Hydration: idle/loading → unauthenticated (getMe falla)
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    // Login: → authenticated
    await act(async () => {
      await result.current.login('test@example.com', 'Password1');
    });
    expect(result.current.status).toBe('authenticated');
  });

  it('logout() limpia el usuario y vuelve a unauthenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login('test@example.com', 'Password1');
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('hasRole() devuelve true solo para el rol del usuario', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login('test@example.com', 'Password1');
    });

    expect(result.current.hasRole('USER')).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(false);
    expect(result.current.hasRole('USER', 'ORGANIZER')).toBe(true);
  });
});
