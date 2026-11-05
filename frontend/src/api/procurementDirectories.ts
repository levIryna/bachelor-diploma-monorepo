import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

function useDirectoryNames(path: string, queryKey: string, enabled: boolean) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: () => apiClient<string[]>(path),
    enabled,
  });
}

export function useProcurementKinds(enabled = true) {
  return useDirectoryNames('/procurement_kinds', 'procurement_kinds', enabled);
}

export type ManagedProcurementKind = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedProcurementKinds(enabled = true) {
  return useQuery({
    queryKey: ['procurement_kinds', 'manage'],
    queryFn: () => apiClient<ManagedProcurementKind[]>('/procurement_kinds/manage'),
    enabled,
  });
}

export function createProcurementKind(name: string): Promise<ManagedProcurementKind> {
  return apiClient<ManagedProcurementKind>('/procurement_kinds', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementKindName(id: string, name: string): Promise<ManagedProcurementKind> {
  return apiClient<ManagedProcurementKind>(`/procurement_kinds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementKindActive(
  id: string,
  isActive: boolean,
): Promise<ManagedProcurementKind> {
  return apiClient<ManagedProcurementKind>(`/procurement_kinds/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteProcurementKind(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/procurement_kinds/${id}`, { method: 'DELETE' });
}

export function useProcurementCategories(enabled = true) {
  return useDirectoryNames('/procurement_categories', 'procurement_categories', enabled);
}

export type ManagedProcurementCategory = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedProcurementCategories(enabled = true) {
  return useQuery({
    queryKey: ['procurement_categories', 'manage'],
    queryFn: () => apiClient<ManagedProcurementCategory[]>('/procurement_categories/manage'),
    enabled,
  });
}

export function createProcurementCategory(name: string): Promise<ManagedProcurementCategory> {
  return apiClient<ManagedProcurementCategory>('/procurement_categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementCategoryName(
  id: string,
  name: string,
): Promise<ManagedProcurementCategory> {
  return apiClient<ManagedProcurementCategory>(`/procurement_categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ManagedProcurementCategory> {
  return apiClient<ManagedProcurementCategory>(`/procurement_categories/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteProcurementCategory(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/procurement_categories/${id}`, { method: 'DELETE' });
}

export function useFundingSources(enabled = true) {
  return useDirectoryNames('/funding_sources', 'funding_sources', enabled);
}

export type ManagedFundingSource = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedFundingSources(enabled = true) {
  return useQuery({
    queryKey: ['funding_sources', 'manage'],
    queryFn: () => apiClient<ManagedFundingSource[]>('/funding_sources/manage'),
    enabled,
  });
}

export function createFundingSource(name: string): Promise<ManagedFundingSource> {
  return apiClient<ManagedFundingSource>('/funding_sources', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateFundingSourceName(id: string, name: string): Promise<ManagedFundingSource> {
  return apiClient<ManagedFundingSource>(`/funding_sources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateFundingSourceActive(
  id: string,
  isActive: boolean,
): Promise<ManagedFundingSource> {
  return apiClient<ManagedFundingSource>(`/funding_sources/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteFundingSource(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/funding_sources/${id}`, { method: 'DELETE' });
}

export function useIpNkrekpItems(enabled = true) {
  return useDirectoryNames('/ip_nkrekp_items', 'ip_nkrekp_items', enabled);
}

export type ManagedIpNkrekpItem = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedIpNkrekpItems(enabled = true) {
  return useQuery({
    queryKey: ['ip_nkrekp_items', 'manage'],
    queryFn: () => apiClient<ManagedIpNkrekpItem[]>('/ip_nkrekp_items/manage'),
    enabled,
  });
}

export function createIpNkrekpItem(name: string): Promise<ManagedIpNkrekpItem> {
  return apiClient<ManagedIpNkrekpItem>('/ip_nkrekp_items', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateIpNkrekpItemName(id: string, name: string): Promise<ManagedIpNkrekpItem> {
  return apiClient<ManagedIpNkrekpItem>(`/ip_nkrekp_items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateIpNkrekpItemActive(
  id: string,
  isActive: boolean,
): Promise<ManagedIpNkrekpItem> {
  return apiClient<ManagedIpNkrekpItem>(`/ip_nkrekp_items/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteIpNkrekpItem(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/ip_nkrekp_items/${id}`, { method: 'DELETE' });
}

export function useProcurementProcedures(enabled = true) {
  return useDirectoryNames('/procurement_procedures', 'procurement_procedures', enabled);
}

export type ManagedProcurementProcedure = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedProcurementProcedures(enabled = true) {
  return useQuery({
    queryKey: ['procurement_procedures', 'manage'],
    queryFn: () => apiClient<ManagedProcurementProcedure[]>('/procurement_procedures/manage'),
    enabled,
  });
}

export function createProcurementProcedure(name: string): Promise<ManagedProcurementProcedure> {
  return apiClient<ManagedProcurementProcedure>('/procurement_procedures', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementProcedureName(
  id: string,
  name: string,
): Promise<ManagedProcurementProcedure> {
  return apiClient<ManagedProcurementProcedure>(`/procurement_procedures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateProcurementProcedureActive(
  id: string,
  isActive: boolean,
): Promise<ManagedProcurementProcedure> {
  return apiClient<ManagedProcurementProcedure>(`/procurement_procedures/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteProcurementProcedure(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/procurement_procedures/${id}`, { method: 'DELETE' });
}

export function useContractTypes(enabled = true) {
  return useDirectoryNames('/contract_types', 'contract_types', enabled);
}

export type ManagedContractType = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

export function useManagedContractTypes(enabled = true) {
  return useQuery({
    queryKey: ['contract_types', 'manage'],
    queryFn: () => apiClient<ManagedContractType[]>('/contract_types/manage'),
    enabled,
  });
}

export function createContractType(name: string): Promise<ManagedContractType> {
  return apiClient<ManagedContractType>('/contract_types', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateContractTypeName(id: string, name: string): Promise<ManagedContractType> {
  return apiClient<ManagedContractType>(`/contract_types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateContractTypeActive(
  id: string,
  isActive: boolean,
): Promise<ManagedContractType> {
  return apiClient<ManagedContractType>(`/contract_types/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteContractType(id: string): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/contract_types/${id}`, { method: 'DELETE' });
}
