import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type DynamicsAnalysisPoint = {
  year: number;
  planned: number;
  actual: number;
  savings: number;
};

export type DynamicsAnalysis = {
  years: DynamicsAnalysisPoint[];
};

function getDynamicsAnalysis(departmentId?: string): Promise<DynamicsAnalysis> {
  return apiClient<DynamicsAnalysis>(`/dynamics_analysis${toQueryString({ departmentId })}`);
}

export function useDynamicsAnalysis(departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['dynamics_analysis', departmentId ?? null],
    queryFn: () => getDynamicsAnalysis(departmentId),
    enabled,
  });
}
