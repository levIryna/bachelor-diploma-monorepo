import type Highcharts from 'highcharts';
import type { CostAnalysisItem } from '../api/costAnalysis';

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

export function getCostAnalysisColumnOptions(items: CostAnalysisItem[] = []): Highcharts.Options {
  return {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: null,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
      categories: items.map((item) => String(item.lineNumber)),
      title: { text: 'Номер пункту' },
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: { text: 'грн' },
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
        const item = items[index];
        if (!item) {
          return false;
        }
        const actual = item.actual === null ? 'Немає договору' : formatUah(item.actual);
        return `<b>${item.lineNumber}. ${item.subject}</b><br/>Заплановано: ${formatUah(item.planned)}<br/>Фактично: ${actual}`;
      },
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
        color: '#7c3aed',
        data: items.map((item) => Math.round(item.planned * 1000)),
      },
      {
        type: 'column',
        name: 'Фактично',
        color: '#e879f9',
        data: items.map((item) => (item.actual === null ? null : Math.round(item.actual * 1000))),
      },
    ],
  };
}
