import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export function useContractors(enabled = true) {
  return useQuery({
    queryKey: ['contractors'],
    queryFn: () => apiClient<string[]>('/contractors'),
    enabled,
  });
}

export type ManagedContractor = {
  id: string;
  name: string;
  edrpou: string | null;
  isActive: boolean;
  canDelete: boolean;
};

export type ContractorInput = {
  name: string;
  edrpou: string;
};

export function useManagedContractors(enabled = true) {
  return useQuery({
    queryKey: ['contractors', 'manage'],
    queryFn: () => apiClient<ManagedContractor[]>('/contractors/manage'),
    enabled,
  });
}

export function createContractor(input: ContractorInput): Promise<ManagedContractor> {
  return apiClient<ManagedContractor>('/contractors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateContractor(id: string, input: ContractorInput): Promise<ManagedContractor> {
  return apiClient<ManagedContractor>(`/contractors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateContractorActive(id: string, isActive: boolean): Promise<ManagedContractor> {
  return apiClient<ManagedContractor>(`/contractors/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteContractor(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/contractors/${id}`, { method: 'DELETE' });
}
