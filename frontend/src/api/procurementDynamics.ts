import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ProcurementDynamicsPoint = {
  year: number;
  planned: number;
  actual: number;
};

function getProcurementDynamics(
  limit?: number,
  departmentId?: string,
): Promise<ProcurementDynamicsPoint[]> {
  return apiClient<ProcurementDynamicsPoint[]>(
    `/procurement_dynamics${toQueryString({ limit, departmentId })}`,
  );
}

export function useProcurementDynamics(limit?: number, enabled = true, departmentId?: string) {
  return useQuery({
    queryKey: ['procurement_dynamics', limit ?? null, departmentId ?? null],
    queryFn: () => getProcurementDynamics(limit, departmentId),
    enabled,
  });
}
