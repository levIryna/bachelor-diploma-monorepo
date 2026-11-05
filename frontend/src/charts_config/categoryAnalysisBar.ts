import type Highcharts from 'highcharts';
import type { CategoryAnalysisItem } from '../api/categoryAnalysis';

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

function itemCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} пункт`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} пункти`;
  }
  return `${count} пунктів`;
}

export function getCategoryAnalysisBarOptions(
  categories: CategoryAnalysisItem[] = [],
): Highcharts.Options {
  const total = categories.reduce((sum, category) => sum + category.planned, 0);

  return {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: null,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
      categories: categories.map((category) => category.name),
      reversed: true,
      labels: {
        style: { fontSize: '12px' },
      },
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
      useHTML: true,
      formatter() {
        const index = this.index ?? 0;
        const category = categories[index];
        if (!category) {
          return false;
        }
        const share = total > 0 ? (category.planned / total) * 100 : 0;
        const shareLabel = share.toLocaleString('uk-UA', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        return `<b>${category.name}</b><br/>${formatUah(category.planned)}<br/>${itemCountLabel(category.items)} · ${shareLabel} %`;
      },
    },
    legend: { enabled: false },
    plotOptions: {
      bar: {
        borderWidth: 0,
        borderRadius: 3,
        maxPointWidth: 18,
        groupPadding: 0.08,
        pointPadding: 0,
      },
    },
    series: [
      {
        type: 'bar',
        name: 'Заплановано',
        color: '#7c3aed',
        data: categories.map((category) => Math.round(category.planned * 1000)),
      },
    ],
  };
}
