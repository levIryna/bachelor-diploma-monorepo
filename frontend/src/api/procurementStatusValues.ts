import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

function getProcurementStatusValues(): Promise<string[]> {
  return apiClient<string[]>('/procurement_statuses/values');
}

export function useProcurementStatusValues(enabled = true) {
  return useQuery({
    queryKey: ['procurement_status_values'],
    queryFn: getProcurementStatusValues,
    enabled,
  });
}
