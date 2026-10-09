import { useMemo, useState } from 'react';
import { BigCard, Dropdown } from '../../components';
import { useDepartments } from '../../hooks/useDepartments';
import { useYears } from '../../hooks/useYears';
import { ANALYTICS_SECTIONS } from './analyticsSections';

export function AnalyticsPage() {
  const years = useYears();
  const departments = useDepartments();

  const [year, setYear] = useState(() => years[0] ?? '2025');
  const [department, setDepartment] = useState('all');

  const yearItems = useMemo(() => years.map((y) => ({ value: y, label: y })), [years]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Аналітика
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Зведені звіти та візуалізації закупівель
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-3">
        <Dropdown ariaLabel="Рік" items={yearItems} value={year} onChange={setYear} />
        <Dropdown
          ariaLabel="Підрозділ"
          items={departments}
          value={department}
          onChange={setDepartment}
        />
      </section>

      <div className="space-y-8">
        {ANALYTICS_SECTIONS.map((section, index) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
            <BigCard>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Секція {index + 1}
              </p>
              <h2
                id={`${section.id}-title`}
                className="text-lg font-semibold text-[var(--color-text-primary)]"
              >
                {section.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{section.description}</p>
              <p className="mt-6 min-h-[220px] rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-6 text-center text-sm text-[var(--color-text-muted)]">
                Тут буде візуалізація ({year}
                {department !== 'all'
                  ? ` · ${departments.find((d) => d.value === department)?.label ?? department}`
                  : ''}
                )
              </p>
            </BigCard>
          </section>
        ))}
      </div>
    </div>
  );
}
