import type Highcharts from 'highcharts';
import type { ProcurementMethodKind } from '../api/procurementMethods';
import { chartInk } from './chartTheme';

const PROCEDURE_COLORS = ['#f97316', '#2563eb', '#7c3aed', '#16a34a', '#e879f9', '#0f766e'];

function contractWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'договір';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'договори';
  }
  return 'договорів';
}

function procedureColor(index: number): string {
  return PROCEDURE_COLORS[index % PROCEDURE_COLORS.length];
}

function procedureNamesOf(kinds: ProcurementMethodKind[]): string[] {
  return [...new Set(kinds.flatMap((kind) => kind.procedures.map((item) => item.name)))].sort(
    (left, right) => left.localeCompare(right, 'uk'),
  );
}

export function getProcurementMethodLegend(kinds: ProcurementMethodKind[]) {
  return procedureNamesOf(kinds).map((name, index) => ({
    name,
    color: procedureColor(index),
  }));
}

function pieCenters(count: number): Array<[string, string]> {
  if (count <= 1) {
    return [['50%', '54%']];
  }
  if (count === 2) {
    return [
      ['26%', '54%'],
      ['74%', '54%'],
    ];
  }
  return [
    ['17%', '54%'],
    ['50%', '54%'],
    ['83%', '54%'],
  ];
}

export function getProcurementMethodsPieOptions(
  kinds: ProcurementMethodKind[] = [],
): Highcharts.Options {
  const ink = chartInk();
  const procedureNames = procedureNamesOf(kinds);
  const colorByName = new Map(procedureNames.map((name, index) => [name, procedureColor(index)]));
  const centers = pieCenters(kinds.length);
  const pieSize = kinds.length >= 3 ? '53%' : kinds.length === 2 ? '71%' : '66%';

  return {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: null,
      spacingTop: 20,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
      events: {
        render() {
          const chart = this as Highcharts.Chart & { drawingPieLabels?: boolean };
          if (chart.drawingPieLabels) {
            return;
          }
          chart.drawingPieLabels = true;
          chart.container.querySelectorAll('.pie-center-label').forEach((node) => node.remove());
          chart.series.forEach((series) => {
            const center = (series as Highcharts.Series & { center?: number[] }).center;
            if (!center || center.length < 3) {
              return;
            }
            const x = chart.plotLeft + center[0];
            const y = chart.plotTop + center[1];
            const total = series.data.reduce((sum, point) => sum + Number(point.y ?? 0), 0);
            const labels = [
              chart.renderer
                .text(String(total), x, y - 8)
                .attr({ align: 'center' })
                .css({ fontSize: '28px', fontWeight: '600', color: ink.text }),
              chart.renderer
                .text(contractWord(total), x, y + 22)
                .attr({ align: 'center' })
                .css({ fontSize: '13px', color: ink.muted }),
              chart.renderer
                .text(series.name, x, chart.plotTop + center[1] - center[2] / 2 - 22)
                .attr({ align: 'center' })
                .css({ fontSize: '14px', fontWeight: '600', color: ink.text }),
            ];
            labels.forEach((label) => {
              label.element.classList.add('pie-center-label');
              label.add();
            });
          });
          chart.drawingPieLabels = false;
        },
      },
    },
    title: { text: '' },
    credits: { enabled: false },
    tooltip: {
      useHTML: true,
      formatter() {
        const count = Number(this.y ?? 0);
        const total = this.series.points.reduce((sum, point) => sum + Number(point.y ?? 0), 0);
        const share = total > 0 ? (count / total) * 100 : 0;
        const shareLabel = share.toLocaleString('uk-UA', { maximumFractionDigits: 1 });
        return `<b>${this.series.name} · ${this.name ?? ''}</b><br/>${count} ${contractWord(count)}, ${shareLabel} %`;
      },
    },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        borderWidth: 2,
        borderColor: ink.surface,
        dataLabels: { enabled: false },
      },
    },
    series: kinds.map((kind, index) => ({
      type: 'pie',
      name: kind.label,
      center: centers[index],
      size: pieSize,
      innerSize: '58%',
      data: [...kind.procedures]
        .sort((left, right) => left.name.localeCompare(right.name, 'uk'))
        .map((procedure) => ({
          name: procedure.name,
          y: procedure.count,
          color: colorByName.get(procedure.name),
        })),
    })),
    responsive: {
      rules: [
        {
          condition: { maxWidth: 640 },
          chartOptions: {
            series: kinds.map((_, index) => ({
              type: 'pie',
              center: ['50%', `${((index + 0.5) / Math.max(kinds.length, 1)) * 100}%`],
              size: '66%',
            })),
          },
        },
      ],
    },
  };
}
