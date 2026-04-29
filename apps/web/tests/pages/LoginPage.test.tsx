import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/public/LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    status: 'unauthenticated',
  }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submit con credenciales válidas invoca login y navega', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password1');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('si login lanza, navigate no se invoca', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
