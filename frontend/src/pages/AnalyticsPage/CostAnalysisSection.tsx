import { useMemo, useState } from 'react';
import { useCostAnalysis } from '../../api/costAnalysis';
import { useYears } from '../../api/years';
import { getCostAnalysisColumnOptions } from '../../charts_config/costAnalysisColumn';
import { Dropdown, PieChart } from '../../components';
import { useDepartmentFilter } from '../../hooks/useDepartmentFilter';
import { toOptions } from '../../utils/toOptions';

function formatAmount(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(Math.abs(uah)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${uah < 0 ? '-' : ''}${grouped} грн`;
}

type SectionHeading = {
  index: number;
  titleId: string;
  label: string;
  description: string;
};

export function CostAnalysisSection({ index, titleId, label, description }: SectionHeading) {
  const { data: years, isLoading: isYearsLoading } = useYears();
  const {
    departmentItems,
    setDepartment,
    departmentLocked,
    isDepartmentsLoading,
    departmentValue,
    departmentId,
    departmentReady,
  } = useDepartmentFilter();
  const [year, setYear] = useState<string>();
  const selectedYear = year ?? years?.[0] ?? '';
  const yearItems = useMemo(() => toOptions(years ?? []), [years]);
  const enabled = selectedYear.length > 0 && departmentReady;
  const { data, isLoading, isError } = useCostAnalysis(selectedYear, departmentId, enabled);
  const items = data?.items ?? [];
  const missingContract = items.some((item) => item.actual === null);
  const hasContract = items.some((item) => item.actual !== null);
  const waiting = !enabled || isYearsLoading || isDepartmentsLoading || isLoading;

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
        <div className="flex shrink-0 flex-wrap justify-end gap-3 self-end sm:self-start">
          <Dropdown
            ariaLabel="Рік"
            isLoading={isYearsLoading}
            items={yearItems}
            value={selectedYear}
            onChange={setYear}
          />
          <Dropdown
            ariaLabel="Обрати підрозділ"
            disabled={departmentLocked}
            isLoading={isDepartmentsLoading}
            items={departmentItems}
            value={departmentValue}
            onChange={setDepartment}
          />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Заплановано</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {data ? formatAmount(data.plannedTotal) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Фактично</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {!data
              ? '—'
              : data.actualTotal === null
                ? 'Немає договорів'
                : formatAmount(data.actualTotal)}
          </p>
          <p className="mt-1 min-h-4 text-xs text-[var(--color-text-muted)]">
            {missingContract && hasContract ? 'Сума лише за пунктами, де вже є договір.' : ''}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {waiting ? (
          <PieChart fill isLoading options={getCostAnalysisColumnOptions()} />
        ) : isError || !data ? (
          <p className="flex h-full items-center text-sm text-[var(--color-text-muted)]">
            Не вдалося завантажити аналіз вартості.
          </p>
        ) : (
          <PieChart
            fill
            emptyText="За обраний рік пунктів не знайдено."
            options={getCostAnalysisColumnOptions(items)}
          />
        )}
      </div>
    </div>
  );
}
