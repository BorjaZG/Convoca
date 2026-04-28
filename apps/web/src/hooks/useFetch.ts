import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/services/api';

export function useFetch<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[] = []
): { data: T | null; loading: boolean; error: ApiError | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fnRef.current(controller.signal)
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as DOMException)?.name === 'AbortError') return;
        setError(err as ApiError);
        setData(null);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { data, loading, error, refetch };
}
