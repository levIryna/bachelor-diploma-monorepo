import type Highcharts from 'highcharts';
import type { ProcurementStatusCount } from '../api/procurementStatuses';
import { PROCUREMENT_STATUS_LABEL } from '../utils/constants';

const PROCUREMENT_STATUS_COLOR = {
  planned: '#94a3b8',
  in_preparation: '#0ea5e9',
  procedure: '#2563eb',
  awaiting_contract: '#d97706',
  contract_signed: '#6366f1',
  completed: '#047857',
} as const;

export function getProcurementStatusPieOptions(rows: ProcurementStatusCount[] = []): Highcharts.Options {
  const data = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      name: PROCUREMENT_STATUS_LABEL[row.status],
      y: row.count,
      color: PROCUREMENT_STATUS_COLOR[row.status],
    }));

  return {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 320,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    tooltip: {
      pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)',
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
    },
    plotOptions: {
      pie: {
        showInLegend: true,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: '{point.y}',
          distance: 12,
        },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Кількість',
        data,
      },
    ],
  };
}
