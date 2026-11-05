import { useDynamicsAnalysis } from '../../api/dynamicsAnalysis';
import { getDynamicsAnalysisSplineOptions } from '../../charts_config/dynamicsAnalysisSpline';
import { Dropdown, PieChart } from '../../components';
import { useDepartmentFilter } from '../../hooks/useDepartmentFilter';

type SectionHeading = {
  index: number;
  titleId: string;
  label: string;
  description: string;
};

export function DynamicsAnalysisSection({ index, titleId, label, description }: SectionHeading) {
  const {
    departmentItems,
    setDepartment,
    departmentLocked,
    isDepartmentsLoading,
    departmentValue,
    departmentId,
    departmentReady,
  } = useDepartmentFilter();
  const { data, isLoading, isError } = useDynamicsAnalysis(departmentId, departmentReady);
  const years = data?.years ?? [];
  const waiting = !departmentReady || isDepartmentsLoading || isLoading;

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
            ariaLabel="Обрати підрозділ"
            disabled={departmentLocked}
            isLoading={isDepartmentsLoading}
            items={departmentItems}
            value={departmentValue}
            onChange={setDepartment}
          />
        </div>
      </div>

      <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
        Економія рахується лише за пунктами, де вже є договір. Якщо в році договорів немає,
        фактично й економія дорівнюють нулю. Від’ємне значення — перевитрата.
      </p>

      <div className="min-h-0 flex-1">
        {waiting ? (
          <PieChart fill isLoading options={getDynamicsAnalysisSplineOptions()} />
        ) : isError || !data ? (
          <p className="flex h-full items-center text-sm text-[var(--color-text-muted)]">
            Не вдалося завантажити динаміку.
          </p>
        ) : (
          <PieChart
            fill
            emptyText="Пунктів плану не знайдено."
            options={getDynamicsAnalysisSplineOptions(years)}
          />
        )}
      </div>
    </div>
  );
}
