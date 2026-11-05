import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type CategoryAnalysisItem = {
  name: string;
  items: number;
  planned: number;
};

export type CategoryAnalysis = {
  categories: CategoryAnalysisItem[];
};

function getCategoryAnalysis(year: string, departmentId?: string): Promise<CategoryAnalysis> {
  return apiClient<CategoryAnalysis>(`/category_analysis${toQueryString({ year, departmentId })}`);
}

export function useCategoryAnalysis(year: string, departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['category_analysis', year, departmentId ?? null],
    queryFn: () => getCategoryAnalysis(year, departmentId),
    enabled: enabled && year.length > 0,
  });
}
