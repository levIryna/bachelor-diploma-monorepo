import type Highcharts from 'highcharts';
import type { ProcurementStatusCount } from '../api/procurementStatuses';
import { PROCUREMENT_STATUS_LABEL } from '../utils/constants';

const PROCUREMENT_STATUS_COLOR = {
  planned: '#c084fc',
  in_preparation: '#f472b6',
  contract_signed: '#a855f7',
  completed: '#34d399',
} as const;

const PIE_STATUSES = [
  'planned',
  'in_preparation',
  'contract_signed',
  'completed',
] as const satisfies ReadonlyArray<keyof typeof PROCUREMENT_STATUS_LABEL>;

const PIE_DIAMETER = 190;

export function getProcurementStatusPieOptions(rows: ProcurementStatusCount[] = []): Highcharts.Options {
  const counts = new Map(rows.map((row) => [row.status, row.count]));
  const data = PIE_STATUSES.flatMap((status) => {
    const count = counts.get(status) ?? 0;
    if (count <= 0) return [];
    return [
      {
        name: PROCUREMENT_STATUS_LABEL[status],
        y: count,
        color: PROCUREMENT_STATUS_COLOR[status],
      },
    ];
  });
  const singleLabel = data.length <= 1;
  const legendRows = singleLabel ? 1 : Math.max(1, Math.ceil(data.length / 2));
  const legendBlock = legendRows * 24 + 8;
  const legendGap = 28;

  return {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 236 + legendBlock + legendGap,
      marginTop: 8,
      marginBottom: legendBlock + legendGap,
      spacingLeft: 8,
      spacingRight: 8,
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
      layout: 'horizontal',
      ...(singleLabel ? {} : { width: 400, itemWidth: 200, itemDistance: 0 }),
      itemMarginTop: 4,
      symbolHeight: 10,
      symbolWidth: 10,
      symbolRadius: 5,
      itemStyle: {
        fontSize: '12px',
        fontWeight: '400',
        color: '#5c4d6e',
        textOverflow: 'ellipsis',
      },
    },
    plotOptions: {
      pie: {
        showInLegend: true,
        size: PIE_DIAMETER,
        center: ['50%', '50%'],
        borderWidth: 2,
        borderColor: '#ffffff',
        dataLabels: {
          enabled: true,
          format: '{point.y}',
          distance: 14,
          filter: {
            property: 'y',
            operator: '>',
            value: 0,
          },
          style: {
            fontSize: '12px',
            fontWeight: '600',
            textOutline: 'none',
          },
        },
      },
    },
    series: [
      {
        type: 'pie',
        id: 'procurement-statuses',
        name: 'Кількість',
        data,
      },
    ],
  };
}
