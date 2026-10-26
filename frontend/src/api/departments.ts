import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type Department = {
  id: string;
  name: string;
};

function getDepartments(): Promise<Department[]> {
  return apiClient<Department[]>('/departments');
}

export function useDepartmentDirectory(enabled = true, userId?: string) {
  return useQuery({
    queryKey: ['departments', userId ?? 'guest'],
    queryFn: getDepartments,
    enabled,
  });
}
