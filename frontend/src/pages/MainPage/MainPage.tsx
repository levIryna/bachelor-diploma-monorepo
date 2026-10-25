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
  PieChart,
  TooltipIcon,
  UserAccountBadge,
} from '../../components';
import { useAppContext } from '../../context/AppContext';
import { useDepartments } from '../../hooks/useDepartments';
import { useCanSelectDepartment, useUserRole } from '../../hooks/useUserAccess';
import { useKpiCards } from '../../api/kpiCards';
import { useProcurementDynamics } from '../../api/procurementDynamics';
import { useProcurementStatuses } from '../../api/procurementStatuses';
import { useYears } from '../../api/years';
import { getProcurementDynamicsColumnOptions } from '../../charts_config/procurementDynamicsColumn';
import { getProcurementStatusPieOptions } from '../../charts_config/procurementStatusPie';
import { getUserInitials } from '../../mocks/user';
import { toOptions } from '../../utils/toOptions';
import { useKpiKardsConfig } from './helper';

export function MainPage() {
  const { isLoggedIn, setLoggedIn } = useAppContext();
  const userRole = useUserRole();
  const showDepartments = useCanSelectDepartment();
  const years_limit = isLoggedIn ? undefined : 3;
  const { data: years, isLoading: isYearsLoading } = useYears(years_limit);
  const departments = useDepartments();

  const [year, setYear] = useState<string>();
  const selectedYear = year ?? years?.[0] ?? '';
  const [department, setDepartment] = useState(departments[0]?.value ?? 'all');

  const { data, isLoading } = useKpiCards(selectedYear);
  const { data: statuses, isLoading: isStatusesLoading } = useProcurementStatuses(selectedYear);
  const { data: dynamics, isLoading: isDynamicsLoading } = useProcurementDynamics(years_limit);
  const yearItems = toOptions(years ?? []);
  const kpiCardsConfig = useKpiKardsConfig(data);
  const isKpiCardsLoading = isYearsLoading || isLoading;

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
            <Dropdown
              ariaLabel="Обрати рік"
              isLoading={isYearsLoading}
              items={yearItems}
              value={selectedYear}
              onChange={setYear}
            />
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
            {kpiCardsConfig.map((card) => (
              <KpiCard
                key={card.title}
                title={card.title}
                value={card.value}
                isLoading={isKpiCardsLoading}
              />
            ))}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BigCard>
            <BigCardHeader
              title="Статус закупівель"
              description={
                selectedYear
                  ? `Скільки пунктів плану перебуває в кожному статусі у ${selectedYear} році`
                  : 'Скільки пунктів плану перебуває в кожному статусі'
              }
            />
            <PieChart
              isLoading={isYearsLoading || isStatusesLoading}
              options={getProcurementStatusPieOptions(statuses)}
            />
          </BigCard>
          <BigCard>
            <BigCardHeader
              title="Динаміка за останні роки"
              description="Запланована сума закупівель і сума укладених договорів за кожен рік"
            />
            <PieChart
              emptyText="Немає даних"
              isLoading={isDynamicsLoading}
              options={getProcurementDynamicsColumnOptions(dynamics)}
            />
          </BigCard>
        </div>
      </main>
    </div>
  );
}
