import type Highcharts from 'highcharts';
import type { ProcurementDynamicsPoint } from '../api/procurementDynamics';

export function getProcurementDynamicsColumnOptions(
  rows: ProcurementDynamicsPoint[] = [],
): Highcharts.Options {
  return {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 320,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
      categories: rows.map((row) => String(row.year)),
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: { text: 'тис. грн' },
    },
    tooltip: {
      shared: true,
      valueDecimals: 2,
      valueSuffix: ' тис. грн',
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        borderRadius: 4,
        grouping: true,
      },
    },
    series: [
      {
        type: 'column',
        name: 'Заплановано',
        color: '#2563eb',
        data: rows.map((row) => row.planned),
      },
      {
        type: 'column',
        name: 'Фактичні витрати',
        color: '#0ea5e9',
        data: rows.map((row) => row.actual),
      },
    ],
  };
}
