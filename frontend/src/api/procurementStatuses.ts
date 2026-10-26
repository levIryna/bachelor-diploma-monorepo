import { useQuery } from '@tanstack/react-query';
import type { PROCUREMENT_STATUS_LABEL } from '../utils/constants';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ProcurementStatusCount = {
  status: keyof typeof PROCUREMENT_STATUS_LABEL;
  count: number;
};

function getProcurementStatuses(
  year: string,
  departmentId?: string,
): Promise<ProcurementStatusCount[]> {
  return apiClient<ProcurementStatusCount[]>(
    `/procurement_statuses${toQueryString({ year, departmentId })}`,
  );
}

export function useProcurementStatuses(year: string, departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['procurement_statuses', year, departmentId ?? null],
    queryFn: () => getProcurementStatuses(year, departmentId),
    enabled: enabled && year.length > 0,
  });
}
