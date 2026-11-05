import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ProcurementMethodSlice = {
  name: string;
  count: number;
};

export type ProcurementMethodKind = {
  type: 'goods' | 'service' | 'work';
  label: string;
  total: number;
  procedures: ProcurementMethodSlice[];
};

export type ProcurementMethods = {
  kinds: ProcurementMethodKind[];
};

function getProcurementMethods(year: string, departmentId?: string): Promise<ProcurementMethods> {
  return apiClient<ProcurementMethods>(
    `/procurement_methods${toQueryString({ year, departmentId })}`,
  );
}

export function useProcurementMethods(year: string, departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['procurement_methods', year, departmentId ?? null],
    queryFn: () => getProcurementMethods(year, departmentId),
    enabled: enabled && year.length > 0,
  });
}
