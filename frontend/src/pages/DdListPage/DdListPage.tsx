import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractDocuments } from '../../api/contractDocuments';
import { Button, Divider, Dropdown, Loader, SearchField } from '../../components';
import { useAppContext } from '../../context/app-context';
import { useYearFilter } from '../../hooks/useYearFilter';
import { paths } from '../../routes/paths';

const TABLE_COLUMNS = [
  'Номер РПЗ',
  'Номер договору',
  'Рік',
  'Предмет',
  'Процедура',
  'Контрагент',
  'Сума',
  'Дата',
] as const;

function formatAmount(valueThousands: number): string {
  const uah = Math.round(valueThousands * 1000);
  const grouped = String(uah).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} грн`;
}

export function DdListPage() {
  const navigate = useNavigate();
  const { isAuthReady, isLoggedIn } = useAppContext();
  const { selectedYear, setYear, yearItems, isYearsLoading } = useYearFilter();
  const [search, setSearch] = useState('');
  const listEnabled = isAuthReady && isLoggedIn && selectedYear.length > 0;
  const {
    data: documents,
    isLoading: isDocumentsLoading,
    isError,
  } = useContractDocuments(selectedYear, listEnabled);
  const isListLoading = !listEnabled || isDocumentsLoading;

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = documents ?? [];
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return String(row.item).includes(query) || row.subject.toLowerCase().includes(query);
    });
  }, [documents, search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Договірна документація
      </h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Пошук за номером РПЗ або предметом закупівлі"
        ariaLabel="Пошук за номером РПЗ або предметом закупівлі"
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
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]${
                    column === 'Процедура' ? ' w-40' : ''
                  }`}
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
                  {search.trim()
                    ? 'За пошуком записів не знайдено.'
                    : 'За обраний рік записів не знайдено.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-muted)]/60"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-[var(--color-text-primary)]">
                    {row.item}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.number ?? ''}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.year}</td>
                  <td className="min-w-[12rem] px-4 py-3">{row.subject}</td>
                  <td className="px-4 py-3">
                    <div className="w-40 whitespace-normal">{row.procedure}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.counterparty}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.amount === null ? '' : formatAmount(row.amount)}
                  </td>
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
