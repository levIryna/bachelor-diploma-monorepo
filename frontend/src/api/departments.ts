import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type Department = {
  id: string;
  name: string;
};

export type ManagedDepartment = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
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

function getManagedDepartments(): Promise<ManagedDepartment[]> {
  return apiClient<ManagedDepartment[]>('/departments/manage');
}

export function useManagedDepartments(enabled = true) {
  return useQuery({
    queryKey: ['departments', 'manage'],
    queryFn: getManagedDepartments,
    enabled,
  });
}

export function createDepartment(name: string): Promise<ManagedDepartment> {
  return apiClient<ManagedDepartment>('/departments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateDepartmentName(id: string, name: string): Promise<ManagedDepartment> {
  return apiClient<ManagedDepartment>(`/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateDepartmentActive(id: string, isActive: boolean): Promise<ManagedDepartment> {
  return apiClient<ManagedDepartment>(`/departments/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteDepartment(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/departments/${id}`, { method: 'DELETE' });
}
