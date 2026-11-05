import type Highcharts from 'highcharts';
import type { DynamicsAnalysisPoint } from '../api/dynamicsAnalysis';

function formatUah(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(Math.abs(uah)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${uah < 0 ? '-' : ''}${grouped} грн`;
}

function formatAxis(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн`;
  }
  return value.toLocaleString('uk-UA');
}

export function getDynamicsAnalysisSplineOptions(
  points: DynamicsAnalysisPoint[] = [],
): Highcharts.Options {
  return {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: null,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
      categories: points.map((point) => String(point.year)),
      title: { text: 'Рік' },
      crosshair: true,
    },
    yAxis: {
      title: { text: 'грн' },
      plotLines: [
        {
          value: 0,
          color: '#cbd5e1',
          width: 1,
          zIndex: 1,
        },
      ],
      labels: {
        formatter() {
          return formatAxis(Number(this.value));
        },
      },
    },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter() {
        const index = this.points?.[0]?.index ?? 0;
        const point = points[index];
        if (!point) {
          return false;
        }
        return `<b>${point.year}</b><br/>Заплановано: ${formatUah(point.planned)}<br/>Фактично: ${formatUah(point.actual)}<br/>Економія: ${formatUah(point.savings)}`;
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
    },
    plotOptions: {
      spline: {
        lineWidth: 2,
        marker: {
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
      },
    },
    series: [
      {
        type: 'spline',
        name: 'Заплановано',
        color: '#7c3aed',
        data: points.map((point) => Math.round(point.planned * 1000)),
      },
      {
        type: 'spline',
        name: 'Фактично',
        color: '#e879f9',
        data: points.map((point) => Math.round(point.actual * 1000)),
      },
      {
        type: 'spline',
        name: 'Економія',
        color: '#16a34a',
        data: points.map((point) => Math.round(point.savings * 1000)),
      },
    ],
  };
}
