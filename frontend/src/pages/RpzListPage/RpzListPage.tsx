import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Dropdown, Loader, SearchField } from '../../components';
import { useProcurementPlanItems } from '../../api/procurementPlanItems';
import { useProcurementStatusValues } from '../../api/procurementStatusValues';
import { useAppContext } from '../../context/app-context';
import { useDepartmentFilter } from '../../hooks/useDepartmentFilter';
import { useYearFilter } from '../../hooks/useYearFilter';
import { paths } from '../../routes/paths';
import { OPEN_PLAN_YEAR, PROCUREMENT_STATUS_LABEL } from '../../utils/constants';

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

const NEED_TYPE_LABEL: Record<string, string> = {
  annual: 'Щорічна',
  one_time: 'Разова',
};

function statusLabel(status: string): string {
  if (status in PROCUREMENT_STATUS_LABEL) {
    return PROCUREMENT_STATUS_LABEL[status as keyof typeof PROCUREMENT_STATUS_LABEL];
  }
  return status;
}

function needLabel(needType: string): string {
  return NEED_TYPE_LABEL[needType] ?? needType;
}

function formatCost(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(uah).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} грн`;
}

export function RpzListPage() {
  const navigate = useNavigate();
  const { isAuthReady, isLoggedIn } = useAppContext();
  const { selectedYear, setYear, yearItems, isYearsLoading } = useYearFilter();
  const {
    departmentItems,
    setDepartment,
    departmentId,
    departmentReady,
    departmentLocked,
    isDepartmentsLoading,
    departmentValue,
  } = useDepartmentFilter();
  const { data: statuses, isLoading: isStatusesQueryLoading } = useProcurementStatusValues(
    isAuthReady && isLoggedIn,
  );
  const isStatusesLoading = !isAuthReady || isStatusesQueryLoading;
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const statusItems = useMemo(() => {
    const options = (statuses ?? []).map((item) => ({
      value: item,
      label: statusLabel(item),
    }));
    return [{ value: 'all', label: 'Усі статуси' }, ...options];
  }, [statuses]);
  const statusValue = statusItems.some((item) => item.value === status) ? status : 'all';
  const statusFilter = statusValue === 'all' ? undefined : statusValue;
  const listEnabled = isAuthReady && isLoggedIn && departmentReady && selectedYear.length > 0;
  const {
    data: planItems,
    isLoading: isPlanItemsLoading,
    isError,
  } = useProcurementPlanItems(selectedYear, departmentId, statusFilter, listEnabled);
  const isListLoading = !listEnabled || isPlanItemsLoading;

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = planItems ?? [];
    if (!query) {
      return rows;
    }

    return rows.filter((row) => row.subject.toLowerCase().includes(query));
  }, [planItems, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Річний план закупівель
        </h1>
        {selectedYear === OPEN_PLAN_YEAR ? (
          <Button text="Додати новий пункт РПЗ" onClick={() => navigate(`${paths.rpz}/new`)} />
        ) : null}
      </div>

      <section className="flex flex-wrap items-center gap-3">
        <Dropdown
          ariaLabel="Обрати рік"
          isLoading={isYearsLoading}
          items={yearItems}
          value={selectedYear}
          onChange={(value) => {
            setYear(value);
            setSearch('');
          }}
        />
        <Dropdown
          ariaLabel="Обрати підрозділ"
          disabled={departmentLocked}
          isLoading={isDepartmentsLoading}
          items={departmentItems}
          value={departmentValue}
          onChange={(value) => {
            setDepartment(value);
            setSearch('');
          }}
        />
        <Dropdown
          ariaLabel="Обрати статус"
          isLoading={isStatusesLoading}
          items={statusItems}
          value={statusValue}
          onChange={(value) => {
            setStatus(value);
            setSearch('');
          }}
        />
      </section>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Пошук за назвою предмету закупівлі"
        ariaLabel="Пошук за назвою предмету закупівлі"
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
            {isListLoading ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1} className="px-4 py-10 text-center">
                  <Loader size={22} />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMNS.length + 1}
                  className="px-4 py-10 text-center text-[var(--color-text-muted)]"
                >
                  Не вдалося завантажити список.
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
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
                    {row.lineNumber}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.department}</td>
                  <td className="min-w-[12rem] px-4 py-3 text-[var(--color-text-primary)]">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-primary)]">
                    {formatCost(row.expectedCost)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {needLabel(row.needType)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      {statusLabel(row.status)}
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
