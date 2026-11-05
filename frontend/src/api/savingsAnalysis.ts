import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type SavingsByDepartment = {
  name: string;
  savings: number;
};

export type SavingsAnalysis = {
  totalSavings: number | null;
  averagePercent: number | null;
  departments: SavingsByDepartment[];
};

function getSavingsAnalysis(year: string): Promise<SavingsAnalysis> {
  return apiClient<SavingsAnalysis>(`/savings_analysis${toQueryString({ year })}`);
}

export function useSavingsAnalysis(year: string, enabled = true) {
  return useQuery({
    queryKey: ['savings_analysis', year],
    queryFn: () => getSavingsAnalysis(year),
    enabled: enabled && year.length > 0,
  });
}
