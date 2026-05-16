import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFetch } from '@/hooks/useFetch';
import type { ApiError } from '@/services/api';

describe('useFetch', () => {
  it('resuelve los datos correctamente', async () => {
    const fn = vi.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useFetch(fn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it('captura el error cuando la petición falla', async () => {
    const apiError: ApiError = { error: 'Not found', status: 404 };
    const fn = vi.fn().mockRejectedValue(apiError);
    const { result } = renderHook(() => useFetch(fn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(apiError);
  });
});
