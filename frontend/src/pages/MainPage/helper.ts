import type { KpiCardsResponse } from '../../api/kpiCards';
import { KPI_CARDS_METRIC, KPI_CARDS_TITLE } from '../../utils/constants';

const KPI_CARD_KEYS = Object.keys(KPI_CARDS_TITLE) as (keyof typeof KPI_CARDS_TITLE)[];

function formatNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const rounded = Math.round(absolute * 100) / 100;
  const [whole, fraction] = rounded.toString().split('.');
  const grouped = absolute > 1000 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : whole;

  return fraction ? `${sign}${grouped},${fraction}` : `${sign}${grouped}`;
}

function formatCardValue(key: keyof typeof KPI_CARDS_TITLE, value: number) {
  const metric = KPI_CARDS_METRIC[key];
  const formatted = formatNumber(value);

  return metric ? `${formatted} ${metric}` : formatted;
}

export function useKpiKardsConfig(data?: KpiCardsResponse) {
  return KPI_CARD_KEYS.map((key) => ({
    title: KPI_CARDS_TITLE[key],
    value: data ? formatCardValue(key, data[key]) : null,
  }));
}
