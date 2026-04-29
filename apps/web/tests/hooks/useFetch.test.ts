import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFetch } from '@/hooks/useFetch';
import type { ApiError } from '@/services/api';

describe('useFetch', () => {
  it('happy path: resuelve datos y desactiva loading', async () => {
    const fn = vi.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useFetch(fn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it('error path: rechaza con error y desactiva loading', async () => {
    const apiError: ApiError = { error: 'Not found', status: 404 };
    const fn = vi.fn().mockRejectedValue(apiError);
    const { result } = renderHook(() => useFetch(fn));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(apiError);
  });

  it('cancela la petición al desmontar: no actualiza estado después de abort', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
      capturedSignal = signal;
      return new Promise<string>(() => {});
    });

    const { unmount } = renderHook(() => useFetch(fn));

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
