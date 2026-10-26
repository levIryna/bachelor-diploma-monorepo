import { useQuery } from '@tanstack/react-query';
import { toQueryString } from '../utils/toQueryString';
import { apiClient } from './client';

export type KpiCardsResponse = {
  planed_sum: number;
  planed_amount: number;
  signed_contracts: number;
  contacts_total_sum: number;
  total_savings: number;
  average_savings: number;
  purchases_in_progress: number;
  in_risk: number;
};

function getKpiCards(year: string, departmentId?: string): Promise<KpiCardsResponse> {
  return apiClient<KpiCardsResponse>(`/kpi_cards${toQueryString({ year, departmentId })}`);
}

export function useKpiCards(year: string, departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['kpi_cards', year, departmentId ?? null],
    queryFn: () => getKpiCards(year, departmentId),
    enabled: enabled && year.length > 0,
  });
}
