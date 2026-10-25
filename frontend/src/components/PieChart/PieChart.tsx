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
};

function hasPoints(options: Highcharts.Options) {
  const series = options.series?.[0];
  return Boolean(series && 'data' in series && Array.isArray(series.data) && series.data.length > 0);
}

export function PieChart({
  options,
  isLoading = false,
  emptyText = 'Немає даних за вибраний рік',
}: PieChartProps) {
  if (isLoading) {
    return (
      <div className="mt-4 flex h-80 items-center justify-center">
        <Loader size={28} />
      </div>
    );
  }

  if (!hasPoints(options)) {
    return <p className="mt-4 text-sm text-[var(--color-text-muted)]">{emptyText}</p>;
  }

  return (
    <div className="mt-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
