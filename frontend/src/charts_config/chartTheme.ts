import Highcharts from 'highcharts';

export function chartInk() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    text: read('--color-text-primary', '#2a1840'),
    secondary: read('--color-text-secondary', '#5c4d6e'),
    muted: read('--color-text-muted', '#7a6b8a'),
    surface: read('--color-surface', '#ffffff'),
    border: read('--color-border', '#eadff3'),
  };
}

export function applyChartTheme() {
  const ink = chartInk();
  Highcharts.setOptions({
    chart: { backgroundColor: 'transparent' },
    xAxis: {
      lineColor: ink.border,
      tickColor: ink.border,
      gridLineColor: ink.border,
      labels: { style: { color: ink.muted } },
      title: { style: { color: ink.muted } },
    },
    yAxis: {
      lineColor: ink.border,
      tickColor: ink.border,
      gridLineColor: ink.border,
      labels: { style: { color: ink.muted } },
      title: { style: { color: ink.muted } },
    },
    legend: {
      itemStyle: { color: ink.secondary, fontWeight: '400' },
      itemHoverStyle: { color: ink.text },
    },
    tooltip: {
      backgroundColor: ink.surface,
      borderColor: ink.border,
      style: { color: ink.text },
    },
  });
}
