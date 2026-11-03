import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

function useDirectoryNames(path: string, queryKey: string, enabled: boolean) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: () => apiClient<string[]>(path),
    enabled,
  });
}

export function useProcurementKinds(enabled = true) {
  return useDirectoryNames('/procurement_kinds', 'procurement_kinds', enabled);
}

export function useProcurementCategories(enabled = true) {
  return useDirectoryNames('/procurement_categories', 'procurement_categories', enabled);
}

export function useFundingSources(enabled = true) {
  return useDirectoryNames('/funding_sources', 'funding_sources', enabled);
}

export function useIpNkrekpItems(enabled = true) {
  return useDirectoryNames('/ip_nkrekp_items', 'ip_nkrekp_items', enabled);
}
