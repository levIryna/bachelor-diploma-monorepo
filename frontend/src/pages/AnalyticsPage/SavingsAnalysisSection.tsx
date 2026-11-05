import { useMemo, useState } from 'react';
import { useSavingsAnalysis } from '../../api/savingsAnalysis';
import { useYears } from '../../api/years';
import { getSavingsAnalysisColumnOptions } from '../../charts_config/savingsAnalysisColumn';
import { Dropdown, PieChart } from '../../components';
import { toOptions } from '../../utils/toOptions';

function formatAmount(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(Math.abs(uah)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${uah < 0 ? '-' : ''}${grouped} грн`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

type SectionHeading = {
  index: number;
  titleId: string;
  label: string;
  description: string;
};

export function SavingsAnalysisSection({ index, titleId, label, description }: SectionHeading) {
  const { data: years, isLoading: isYearsLoading } = useYears();
  const [year, setYear] = useState<string>();
  const selectedYear = year ?? years?.[0] ?? '';
  const yearItems = useMemo(() => toOptions(years ?? []), [years]);
  const { data, isLoading, isError } = useSavingsAnalysis(selectedYear, selectedYear.length > 0);
  const departments = data?.departments ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
            Секція {index + 1}
          </p>
          <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text-primary)]">
            {label}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>
        <div className="flex shrink-0 justify-end self-end sm:self-start">
          <Dropdown
            ariaLabel="Рік"
            isLoading={isYearsLoading}
            items={yearItems}
            value={selectedYear}
            onChange={setYear}
          />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Загальна економія</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {!data ? '—' : data.totalSavings === null ? 'Немає договорів' : formatAmount(data.totalSavings)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Середній відсоток економії
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {!data
              ? '—'
              : data.averagePercent === null
                ? 'Немає договорів'
                : formatPercent(data.averagePercent)}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
        Враховано лише пункти, де вже є договір. Зелений стовпчик — економія, червоний —
        перевитрата.
      </p>

      <div className="min-h-0 flex-1">
        {isYearsLoading || isLoading ? (
          <PieChart fill isLoading options={getSavingsAnalysisColumnOptions()} />
        ) : isError || !data ? (
          <p className="flex h-full items-center text-sm text-[var(--color-text-muted)]">
            Не вдалося завантажити аналіз економії.
          </p>
        ) : (
          <PieChart
            fill
            emptyText="За обраний рік договорів не знайдено."
            options={getSavingsAnalysisColumnOptions(departments)}
          />
        )}
      </div>
    </div>
  );
}
