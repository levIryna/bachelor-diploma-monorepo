import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type CostAnalysisItem = {
  id: string;
  lineNumber: number;
  subject: string;
  planned: number;
  actual: number | null;
};

export type CostAnalysis = {
  plannedTotal: number;
  actualTotal: number | null;
  items: CostAnalysisItem[];
};

function getCostAnalysis(year: string, departmentId?: string): Promise<CostAnalysis> {
  return apiClient<CostAnalysis>(`/cost_analysis${toQueryString({ year, departmentId })}`);
}

export function useCostAnalysis(year: string, departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['cost_analysis', year, departmentId ?? null],
    queryFn: () => getCostAnalysis(year, departmentId),
    enabled: enabled && year.length > 0,
  });
}
