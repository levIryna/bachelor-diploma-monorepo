import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ProcurementDynamicsPoint = {
  year: number;
  planned: number;
  actual: number;
};

function getProcurementDynamics(limit?: number): Promise<ProcurementDynamicsPoint[]> {
  return apiClient<ProcurementDynamicsPoint[]>(`/procurement_dynamics${toQueryString({ limit })}`);
}

export function useProcurementDynamics(limit?: number) {
  return useQuery({
    queryKey: ['procurement_dynamics', limit],
    queryFn: () => getProcurementDynamics(limit),
  });
}
