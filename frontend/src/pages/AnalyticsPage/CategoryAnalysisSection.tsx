import { useMemo, useState } from 'react';
import { useCategoryAnalysis } from '../../api/categoryAnalysis';
import { useYears } from '../../api/years';
import { getCategoryAnalysisBarOptions } from '../../charts_config/categoryAnalysisBar';
import { Dropdown, PieChart } from '../../components';
import { useDepartmentFilter } from '../../hooks/useDepartmentFilter';
import { toOptions } from '../../utils/toOptions';

type SectionHeading = {
  index: number;
  titleId: string;
  label: string;
  description: string;
};

export function CategoryAnalysisSection({ index, titleId, label, description }: SectionHeading) {
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
  const { data, isLoading, isError } = useCategoryAnalysis(selectedYear, departmentId, enabled);
  const categories = data?.categories ?? [];
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

      <div className="min-h-0 flex-1">
        {waiting ? (
          <PieChart fill isLoading options={getCategoryAnalysisBarOptions()} />
        ) : isError || !data ? (
          <p className="flex h-full items-center text-sm text-[var(--color-text-muted)]">
            Не вдалося завантажити розподіл за категоріями.
          </p>
        ) : (
          <PieChart
            fill
            emptyText="За обраний рік пунктів не знайдено."
            options={getCategoryAnalysisBarOptions(categories)}
          />
        )}
      </div>
    </div>
  );
}
