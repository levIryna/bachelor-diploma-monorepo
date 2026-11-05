import { useQuery, type QueryClient } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ProcurementPlanItem = {
  id: string;
  year: number;
  lineNumber: number;
  department: string;
  subject: string;
  expectedCost: number;
  needType: string;
  status: string;
  buyer: string;
};

function getProcurementPlanItems(
  year: string,
  departmentId?: string,
  status?: string,
): Promise<ProcurementPlanItem[]> {
  return apiClient<ProcurementPlanItem[]>(
    `/procurement_plan_items${toQueryString({ year, departmentId, status })}`,
  );
}

export type ProcurementPlanItemDetail = {
  year: number;
  lineNumber: number;
  department: string;
  headFullName: string;
  executorFullName: string;
  subject: string;
  needType: string;
  procurementKind: string;
  category: string;
  fundingSource: string;
  ipItem: string;
  eventName: string;
  expectedCost: number;
  completionDate: string;
  counterparty: string;
  plannedTzSubmitDate: string;
  plannedContractDate: string;
  plannedWorkStartDate: string;
  buyer: string;
  status: string;
};

export type PlanItemContractDocument = {
  id: string;
  seqNumber: number | null;
  subject: string;
  contractDate: string;
  contractor: string;
};

function getPlanItemContractDocuments(id: string): Promise<PlanItemContractDocument[]> {
  return apiClient<PlanItemContractDocument[]>(`/procurement_plan_items/${id}/contract_documents`);
}

export function usePlanItemContractDocuments(id: string, enabled = true) {
  return useQuery({
    queryKey: ['plan_item_contract_documents', id],
    queryFn: () => getPlanItemContractDocuments(id),
    enabled: enabled && id.length > 0 && id !== 'new',
  });
}

function getProcurementPlanItem(id: string): Promise<ProcurementPlanItemDetail> {
  return apiClient<ProcurementPlanItemDetail>(`/procurement_plan_items/${id}`);
}

export type ProcurementPlanItemUpdate = {
  department: string;
  headFullName: string;
  executorFullName: string;
  subject: string;
  needType: string;
  procurementKind: string;
  category: string;
  fundingSource: string;
  ipItem: string;
  eventName: string;
  expectedCost: number;
  completionDate: string;
  counterparty: string;
  plannedTzSubmitDate: string;
  plannedContractDate: string;
  plannedWorkStartDate: string;
  buyer: string;
  status: string;
};

export type ProcurementPlanItemCreate = ProcurementPlanItemUpdate & {
  year: number;
};

function createProcurementPlanItem(body: ProcurementPlanItemCreate): Promise<{ id: string }> {
  return apiClient<{ id: string }>('/procurement_plan_items', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function updateProcurementPlanItem(
  id: string,
  body: ProcurementPlanItemUpdate,
): Promise<ProcurementPlanItemDetail> {
  return apiClient<ProcurementPlanItemDetail>(`/procurement_plan_items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function invalidateRpzQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['procurement_plan_item'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_plan_items'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_status_values'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_statuses'] }),
    queryClient.invalidateQueries({ queryKey: ['years'] }),
    queryClient.invalidateQueries({ queryKey: ['departments'] }),
    queryClient.invalidateQueries({ queryKey: ['kpi_cards'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_dynamics'] }),
    queryClient.invalidateQueries({ queryKey: ['dynamics_analysis'] }),
    queryClient.invalidateQueries({ queryKey: ['category_analysis'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_methods'] }),
  ]);
}

export function useProcurementPlanItem(id: string, enabled = true) {
  return useQuery({
    queryKey: ['procurement_plan_item', id],
    queryFn: () => getProcurementPlanItem(id),
    enabled: enabled && id.length > 0 && id !== 'new',
  });
}

function deleteProcurementPlanItem(id: string): Promise<{ ok: true }> {
  return apiClient<{ ok: true }>(`/procurement_plan_items/${id}`, {
    method: 'DELETE',
  });
}

export { createProcurementPlanItem, updateProcurementPlanItem, deleteProcurementPlanItem };

export function useProcurementPlanItems(
  year: string,
  departmentId?: string,
  status?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['procurement_plan_items', year, departmentId ?? null, status ?? null],
    queryFn: () => getProcurementPlanItems(year, departmentId, status),
    enabled: enabled && year.length > 0,
  });
}
