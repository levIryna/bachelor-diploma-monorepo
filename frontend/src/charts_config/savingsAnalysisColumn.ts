import type Highcharts from 'highcharts';
import type { SavingsByDepartment } from '../api/savingsAnalysis';

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

export function getSavingsAnalysisColumnOptions(
  departments: SavingsByDepartment[] = [],
): Highcharts.Options {
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
      categories: departments.map((department) => department.name),
      crosshair: true,
      labels: {
        style: { fontSize: '12px' },
      },
    },
    yAxis: {
      title: { text: 'грн' },
      labels: {
        formatter() {
          return formatAxis(Number(this.value));
        },
      },
    },
    tooltip: {
      useHTML: true,
      formatter() {
        const index = this.index ?? 0;
        const department = departments[index];
        if (!department) {
          return false;
        }
        const label = department.savings < 0 ? 'Перевитрата' : 'Економія';
        return `<b>${department.name}</b><br/>${label}: ${formatUah(department.savings)}`;
      },
    },
    legend: { enabled: false },
    plotOptions: {
      column: {
        borderWidth: 0,
        borderRadius: 4,
        negativeColor: '#dc2626',
      },
    },
    series: [
      {
        type: 'column',
        name: 'Економія',
        color: '#16a34a',
        data: departments.map((department) => Math.round(department.savings * 1000)),
      },
    ],
  };
}
