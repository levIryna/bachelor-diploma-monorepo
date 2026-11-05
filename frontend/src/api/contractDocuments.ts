import { useQuery, type QueryClient } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type ContractDocumentListItem = {
  id: string;
  number: number | null;
  year: number;
  item: number;
  subject: string;
  procedure: string;
  counterparty: string;
  amount: number | null;
  date: string;
};

function getContractDocuments(year: string): Promise<ContractDocumentListItem[]> {
  return apiClient<ContractDocumentListItem[]>(`/contract_documents${toQueryString({ year })}`);
}

export function useContractDocuments(year: string, enabled = true) {
  return useQuery({
    queryKey: ['contract_documents', year],
    queryFn: () => getContractDocuments(year),
    enabled: enabled && year.length > 0,
  });
}

export type ContractDocumentAmendment = {
  date: string;
  description: string;
};

export type ContractDocumentDetail = {
  seqNumber: number | null;
  year: number;
  lineNumber: number;
  subject: string;
  expectedCostThousands: number | null;
  procedure: string;
  department: string;
  tzResponsibleName: string;
  technicalExpertName: string;
  estimatorName: string;
  buyerName: string;
  actualApplicationDate: string;
  procedureNumber: string;
  etmUrl: string;
  contractor: string;
  contractSubject: string;
  contractAmountThousands: number | null;
  contractDate: string;
  contractType: string;
  validFrom: string;
  validTo: string;
  notes: string;
  amendments: ContractDocumentAmendment[];
};

export type ContractDocumentUpdate = {
  subject: string;
  expectedCostThousands: number | null;
  procedure: string;
  department: string;
  tzResponsibleName: string;
  technicalExpertName: string;
  estimatorName: string;
  buyerName: string;
  actualApplicationDate: string;
  procedureNumber: string;
  etmUrl: string;
  contractor: string;
  contractSubject: string;
  contractAmountThousands: number | null;
  contractDate: string;
  contractType: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

function getContractDocument(id: string): Promise<ContractDocumentDetail> {
  return apiClient<ContractDocumentDetail>(`/contract_documents/${id}`);
}

export function useContractDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: ['contract_document', id],
    queryFn: () => getContractDocument(id),
    enabled: enabled && id.length > 0 && id !== 'new',
  });
}

export type ContractDocumentCreate = ContractDocumentUpdate & {
  planItemId: string;
  itemType: string;
};

export function createContractDocument(body: ContractDocumentCreate): Promise<{ id: string }> {
  return apiClient<{ id: string }>('/contract_documents', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteContractDocument(id: string): Promise<{ ok: true }> {
  return apiClient<{ ok: true }>(`/contract_documents/${id}`, {
    method: 'DELETE',
  });
}

export function updateContractDocument(
  id: string,
  body: ContractDocumentUpdate,
): Promise<ContractDocumentDetail> {
  return apiClient<ContractDocumentDetail>(`/contract_documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function invalidateContractDocumentQueries(queryClient: QueryClient, id: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['contract_document', id] }),
    queryClient.invalidateQueries({ queryKey: ['contract_documents'] }),
    queryClient.invalidateQueries({ queryKey: ['plan_item_contract_documents'] }),
    queryClient.invalidateQueries({ queryKey: ['kpi_cards'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_dynamics'] }),
    queryClient.invalidateQueries({ queryKey: ['dynamics_analysis'] }),
    queryClient.invalidateQueries({ queryKey: ['procurement_methods'] }),
  ]);
}
