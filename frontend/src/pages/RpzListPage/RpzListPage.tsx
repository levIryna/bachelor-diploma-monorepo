import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Dropdown, SearchField } from '../../components';
import { useYears } from '../../api/years';
import { useDepartments } from '../../hooks/useDepartments';
import { mockRpzListItems, RPZ_STATUS_FILTER_OPTIONS } from '../../mocks/rpzList';
import { paths } from '../../routes/paths';
import { toOptions } from '../../utils/toOptions';

const TABLE_COLUMNS = [
  'Рік',
  'Номер',
  'Підрозділ',
  'Предмет',
  'Очікувана вартість',
  'Потреба',
  'Статус',
  'Закупник',
] as const;

export function RpzListPage() {
  const navigate = useNavigate();
  const { data: years, isLoading } = useYears();
  const departments = useDepartments();

  const [year, setYear] = useState<string>();
  const selectedYear = year ?? years?.[0] ?? '';
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const yearItems = useMemo(() => toOptions(years ?? []), [years]);

  const statusItems = RPZ_STATUS_FILTER_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockRpzListItems.filter((row) => {
      if (row.year !== selectedYear) {
        return false;
      }

      if (department !== 'all') {
        const deptLabel = departments.find((d) => d.value === department)?.label ?? '';
        if (deptLabel && row.department !== deptLabel) {
          return false;
        }
      }

      if (status !== 'all') {
        const statusLabel = statusItems.find((s) => s.value === status)?.label ?? '';
        if (statusLabel !== 'Усі статуси' && row.status !== statusLabel) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const haystack = [
        row.year,
        row.number,
        row.department,
        row.subject,
        row.expectedCost,
        row.need,
        row.status,
        row.buyer,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [department, departments, search, status, statusItems, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            РПЗ — список
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Річний план закупівель підприємства
          </p>
        </div>
        <Button text="Додати новий пункт РПЗ" onClick={() => navigate(`${paths.rpz}/new`)} />
      </div>

      <section className="flex flex-wrap items-center gap-3">
        <Dropdown
          ariaLabel="Фільтр за роком"
          isLoading={isLoading}
          items={yearItems}
          value={selectedYear}
          onChange={setYear}
        />
        <Dropdown
          ariaLabel="Фільтр за підрозділом"
          items={departments}
          value={department}
          onChange={setDepartment}
        />
        <Dropdown
          ariaLabel="Фільтр за статусом"
          items={statusItems}
          value={status}
          onChange={setStatus}
        />
      </section>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Пошук за номером, предметом, закупником…"
        ariaLabel="Пошук у списку РПЗ"
      />

      <Divider />

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                >
                  {column}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Дії</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMNS.length + 1}
                  className="px-4 py-10 text-center text-[var(--color-text-muted)]"
                >
                  За обраними фільтрами записів не знайдено.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-muted)]/60"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-primary)]">
                    {row.year}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-[var(--color-text-primary)]">
                    {row.number}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.department}</td>
                  <td className="min-w-[12rem] px-4 py-3 text-[var(--color-text-primary)]">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-primary)]">
                    {row.expectedCost}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {row.need}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {row.buyer}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      text="Деталі"
                      onClick={() => navigate(`${paths.rpz}/${row.id}`)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
