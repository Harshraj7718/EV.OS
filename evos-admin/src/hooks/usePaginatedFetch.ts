import { useEffect, useState } from 'react';
import { api, ApiSuccess, getErrorMessage } from '@/lib/api';
import { PaginatedResult } from '@/types';

export function usePaginatedFetch<T>(
  endpoint: string,
  page: number,
  filters: Record<string, string | undefined>,
  limit = 20
) {
  const [data, setData] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = { page, limit };
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value;
    }

    api
      .get<ApiSuccess<PaginatedResult<T>>>(endpoint, { params })
      .then((response) => {
        if (!cancelled) setData(response.data.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, limit, filterKey]);

  return { data, loading, error };
}
