import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export function useContractors(enabled = true) {
  return useQuery({
    queryKey: ['contractors'],
    queryFn: () => apiClient<string[]>('/contractors'),
    enabled,
  });
}
