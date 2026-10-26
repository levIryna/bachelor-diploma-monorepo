import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

function getAvailableYears(limit?: number): Promise<string[]> {
  return apiClient<string[]>(`/years${toQueryString({ limit })}`);
}

export function useYears(limit?: number, enabled = true) {
  return useQuery({
    queryKey: ['years', limit],
    queryFn: () => getAvailableYears(limit),
    enabled,
  });
}
