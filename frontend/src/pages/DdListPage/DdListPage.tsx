import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Dropdown, SearchField } from '../../components';
import { useYearFilter } from '../../hooks/useYearFilter';
import { mockDdListItems } from '../../mocks/ddList';
import { paths } from '../../routes/paths';

const TABLE_COLUMNS = [
  'Номер',
  'Рік',
  'Пункт',
  'Предмет',
  'Процедура',
  'Контрагент',
  'Сума',
  'Дата',
] as const;

export function DdListPage() {
  const navigate = useNavigate();
  const { selectedYear, setYear, yearItems, isYearsLoading } = useYearFilter();
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockDdListItems.filter((row) => {
      if (row.year !== selectedYear) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        row.number,
        row.year,
        row.item,
        row.subject,
        row.procedure,
        row.counterparty,
        row.amount,
        row.date,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, selectedYear]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">ДД</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Договірна документація</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Dropdown
          ariaLabel="Обрати рік"
          isLoading={isYearsLoading}
          items={yearItems}
          value={selectedYear}
          onChange={setYear}
        />
        <Button text="Додати ДД" onClick={() => navigate(`${paths.procurements}/new`)} />
      </div>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Пошук за номером, предметом, контрагентом…"
        ariaLabel="Пошук у списку ДД"
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
                  За обраний рік записів не знайдено.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-muted)]/60"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                    {row.number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.year}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.item}</td>
                  <td className="min-w-[12rem] px-4 py-3">{row.subject}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.procedure}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.counterparty}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      text="Деталі"
                      onClick={() => navigate(`${paths.procurements}/${row.id}`)}
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
