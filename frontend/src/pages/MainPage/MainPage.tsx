import { useState } from 'react';
import {
  BigCard,
  BigCardHeader,
  Button,
  Divider,
  Dropdown,
  EnterpriseBrand,
  KpiCard,
  Navigation,
  TooltipIcon,
  UserAccountBadge,
} from '../../components';
import { useAppContext } from '../../context/AppContext';
import { useDepartments } from '../../hooks/useDepartments';
import { useCanSelectDepartment, useUserRole } from '../../hooks/useUserAccess';
import { useYears } from '../../hooks/useYears';
import { getUserInitials } from '../../mocks/user';

const MOCK_KPI_CARDS = [
  { title: 'Заплановано — сума', value: 'mock', description: 'mock' },
  { title: 'Закупівель у плані — сума', value: 'mock', description: 'mock' },
  { title: 'Договорів укладено — число', value: 'mock', description: 'mock' },
  { title: 'Загальна сума догов. — число', value: 'mock', description: 'mock' },
  { title: 'Економія — %', value: 'mock', description: 'mock' },
  { title: 'Сер. економія — %', value: 'mock', description: 'mock' },
  { title: 'Договорів у роботі — число', value: 'mock', description: 'mock' },
  { title: 'Ризик строків — число', value: 'mock', description: 'mock' },
] as const;

export function MainPage() {
  const { isLoggedIn, setLoggedIn } = useAppContext();
  const userRole = useUserRole();
  const showDepartments = useCanSelectDepartment();
  const years = useYears();
  const departments = useDepartments();

  const [year, setYear] = useState(years[0] ?? '2025');
  const [department, setDepartment] = useState(departments[0]?.value ?? 'all');

  const yearItems = years.map((y) => ({ value: y, label: y }));

  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <EnterpriseBrand companyName="ТОВ 'Укрпромінвест'" />
            {isLoggedIn ? <Navigation /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {isLoggedIn ? (
              <UserAccountBadge initials={getUserInitials()} role={userRole} />
            ) : (
              <Button text="Залогуватись" onClick={() => setLoggedIn(true)} />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">KPI</h1>
            <TooltipIcon text="KPI (Key Performance Indicators) — ключові показники ефективності закупівель підприємства." />
            <Dropdown ariaLabel="Обрати рік" items={yearItems} value={year} onChange={setYear} />
            {showDepartments ? (
              <Dropdown
                ariaLabel="Обрати підрозділ"
                items={departments}
                value={department}
                onChange={setDepartment}
              />
            ) : null}
          </div>

          <Divider />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_KPI_CARDS.map((card) => (
              <KpiCard
                key={card.title}
                title={card.title}
                value={card.value}
                description={card.description}
              />
            ))}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BigCard>
            <BigCardHeader title="Статус закупівель" description={`Дані за ${year} рік`} />
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              here is gonan be chart later
            </p>
          </BigCard>
          <BigCard>
            <BigCardHeader
              title="Динаміка за останні 5 років"
              description="Порівняння планових асигнувань та факту виконання"
            />
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              here is gonan be chart later
            </p>
          </BigCard>
        </div>
      </main>
    </div>
  );
}
