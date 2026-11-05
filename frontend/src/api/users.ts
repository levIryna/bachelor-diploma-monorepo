import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
};

export type UserCreateInput = {
  email: string;
  fullName: string;
  role: string;
  departmentId: string | null;
  password: string;
  passwordConfirm: string;
};

export type UserFieldPatch = {
  email?: string;
  fullName?: string;
  role?: string;
  departmentId?: string | null;
  isActive?: boolean;
};

export type UserPasswordInput = {
  password: string;
  passwordConfirm: string;
  adminPassword: string;
};

function getManagedUsers(): Promise<ManagedUser[]> {
  return apiClient<ManagedUser[]>('/users/manage');
}

export function useManagedUsers(enabled = true) {
  return useQuery({
    queryKey: ['users', 'manage'],
    queryFn: getManagedUsers,
    enabled,
  });
}

function getUser(id: string): Promise<ManagedUser> {
  return apiClient<ManagedUser>(`/users/${id}`);
}

export function useManagedUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: id.length > 0,
  });
}

export function createUser(input: UserCreateInput): Promise<ManagedUser> {
  return apiClient<ManagedUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, patch: UserFieldPatch): Promise<ManagedUser> {
  return apiClient<ManagedUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function updateUserPassword(id: string, input: UserPasswordInput): Promise<ManagedUser> {
  return apiClient<ManagedUser>(`/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/users/${id}`, { method: 'DELETE' });
}
