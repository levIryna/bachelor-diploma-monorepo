import { useLayoutEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactOfficial from 'highcharts-react-official';
import { Loader } from '../Loader/Loader';

type HighchartsReactComponent = typeof HighchartsReactOfficial;

function resolveHighchartsReact(exported: HighchartsReactComponent): HighchartsReactComponent {
  const moduleShape = exported as HighchartsReactComponent & {
    HighchartsReact?: HighchartsReactComponent;
    default?: HighchartsReactComponent;
  };

  return moduleShape.HighchartsReact ?? moduleShape.default ?? exported;
}

const HighchartsReact = resolveHighchartsReact(HighchartsReactOfficial);

type PieChartProps = {
  options: Highcharts.Options;
  isLoading?: boolean;
  emptyText?: string;
  fill?: boolean;
};

function chartFillingContainer(options: Highcharts.Options): Highcharts.Options {
  const rules = options.responsive?.rules?.map((rule) => ({
    ...rule,
    chartOptions: {
      ...rule.chartOptions,
      chart: {
        ...rule.chartOptions?.chart,
        height: null,
      },
    },
  }));

  return {
    ...options,
    chart: {
      ...options.chart,
      height: null,
    },
    responsive: rules ? { ...options.responsive, rules } : options.responsive,
  };
}

function hasPoints(options: Highcharts.Options) {
  const series = options.series?.[0];
  return Boolean(series && 'data' in series && Array.isArray(series.data) && series.data.length > 0);
}

function FilledChart({ options }: { options: Highcharts.Options }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HighchartsReactOfficial.RefObject>(null);

  const applySize = (chart?: Highcharts.Chart) => {
    const host = hostRef.current;
    const target = chart ?? chartRef.current?.chart;
    if (!host || !target) {
      return;
    }
    const height = Math.floor(host.clientHeight);
    const width = Math.floor(host.clientWidth);
    if (height > 1 && (Math.abs(target.chartHeight - height) > 1 || Math.abs(target.chartWidth - width) > 1)) {
      target.setSize(width, height, false);
    }
  };

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }
    const observer = new ResizeObserver(() => applySize());
    observer.observe(host);
    applySize();
    return () => observer.disconnect();
  }, [options]);

  return (
    <div ref={hostRef} className="h-full min-h-0">
      <HighchartsReact
        ref={chartRef}
        highcharts={Highcharts}
        options={chartFillingContainer(options)}
        containerProps={{ style: { height: '100%', width: '100%' } }}
        callback={(chart: Highcharts.Chart) => applySize(chart)}
      />
    </div>
  );
}

export function PieChart({
  options,
  isLoading = false,
  emptyText = 'Немає даних за вибраний рік',
  fill = false,
}: PieChartProps) {
  if (isLoading) {
    return (
      <div
        className={
          fill
            ? 'flex h-full items-center justify-center'
            : 'mt-4 flex h-80 items-center justify-center'
        }
      >
        <Loader size={28} />
      </div>
    );
  }

  if (!hasPoints(options)) {
    return (
      <p
        className={
          fill
            ? 'flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]'
            : 'mt-4 text-sm text-[var(--color-text-muted)]'
        }
      >
        {emptyText}
      </p>
    );
  }

  if (fill) {
    return <FilledChart options={options} />;
  }

  return (
    <div className="mt-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
