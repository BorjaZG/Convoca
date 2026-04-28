const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:4000';

export type ApiError = { error: string; status: number };

function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export { isApiError };

async function execute<T>(endpoint: string, options: RequestInit, retry: boolean): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  // Auto-refresh on 401 (once, never for the refresh endpoint itself)
  if (res.status === 401 && retry && !endpoint.includes('/auth/refresh')) {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal: options.signal,
    });
    if (refreshRes.ok) {
      return execute<T>(endpoint, options, false);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Error desconocido' }));
    const err: ApiError = { error: (body as { error?: string }).error ?? 'Error desconocido', status: res.status };
    throw err;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options: RequestInit = {}) =>
    execute<T>(endpoint, { ...options, method: 'GET' }, true),

  post: <T>(endpoint: string, body?: unknown, options: RequestInit = {}) =>
    execute<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }, true),

  put: <T>(endpoint: string, body?: unknown, options: RequestInit = {}) =>
    execute<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }, true),

  patch: <T>(endpoint: string, body?: unknown, options: RequestInit = {}) =>
    execute<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }, true),

  delete: <T = void>(endpoint: string, options: RequestInit = {}) =>
    execute<T>(endpoint, { ...options, method: 'DELETE' }, true),
};
