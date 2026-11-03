import { useState } from 'react';
import {
  BigCard,
  BigCardHeader,
  Button,
  Divider,
  Dropdown,
  EnterpriseBrand,
  KpiCard,
  LoginDialog,
  Loader,
  Navigation,
  PieChart,
  TooltipIcon,
  UserSession,
} from '../../components';
import { useAppContext } from '../../context/app-context';
import { useDepartmentFilter } from '../../hooks/useDepartmentFilter';
import { useKpiCards } from '../../api/kpiCards';
import { useProcurementDynamics } from '../../api/procurementDynamics';
import { useProcurementStatuses } from '../../api/procurementStatuses';
import { getProcurementDynamicsColumnOptions } from '../../charts_config/procurementDynamicsColumn';
import { getProcurementStatusPieOptions } from '../../charts_config/procurementStatusPie';
import { useYearFilter } from '../../hooks/useYearFilter';
import { useKpiKardsConfig } from './helper';

export function MainPage() {
  const { isAuthReady, isLoggedIn } = useAppContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { yearsLimit, selectedYear, setYear, yearItems, isYearsLoading } = useYearFilter();
  const {
    departmentItems,
    selectedDepartment,
    setDepartment,
    departmentId,
    departmentReady,
    selectedDepartmentLabel,
    departmentLocked,
    isDepartmentsLoading,
    departmentValue,
  } = useDepartmentFilter();

  const { data, isLoading } = useKpiCards(selectedYear, departmentId, departmentReady);
  const { data: statuses, isLoading: isStatusesLoading } = useProcurementStatuses(
    selectedYear,
    departmentId,
    departmentReady,
  );
  const { data: dynamics, isLoading: isDynamicsQueryLoading } = useProcurementDynamics(
    yearsLimit,
    isAuthReady && departmentReady,
    departmentId,
  );
  const isDynamicsLoading = !isAuthReady || !departmentReady || isDynamicsQueryLoading;
  const kpiCardsConfig = useKpiKardsConfig(data);
  const isKpiCardsLoading = isYearsLoading || isLoading;

  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-50 bg-[var(--color-header)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <EnterpriseBrand companyName="ТОВ 'Укрпромінвест'" />
            {isLoggedIn ? <Navigation /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {!isAuthReady ? (
              <Loader tone="light" />
            ) : isLoggedIn ? (
              <UserSession />
            ) : (
              <Button text="Увійти" variant="onHeader" onClick={() => setIsLoginOpen(true)} />
            )}
          </div>
        </div>
      </header>
      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

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
            {isLoggedIn ? (
              <Dropdown
                ariaLabel="Обрати підрозділ"
                disabled={departmentLocked}
                isLoading={isDepartmentsLoading}
                items={departmentItems}
                value={departmentValue}
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
                  ? `Розподіл пунктів річного плану закупівель за статусами у ${selectedYear} році${
                      selectedDepartmentLabel && selectedDepartment !== 'all'
                        ? ` · ${selectedDepartmentLabel}`
                        : ''
                    }`
                  : 'Розподіл пунктів річного плану закупівель за статусами'
              }
            />
            <PieChart
              key={`statuses-${selectedYear}-${departmentId ?? 'all'}`}
              isLoading={isYearsLoading || !departmentReady || isStatusesLoading}
              options={getProcurementStatusPieOptions(statuses)}
            />
          </BigCard>
          <BigCard>
            <BigCardHeader
              title="Динаміка за останні роки"
              description={
                selectedDepartmentLabel && selectedDepartment !== 'all'
                  ? `Запланована сума закупівель і сума укладених договорів за кожен рік · ${selectedDepartmentLabel}`
                  : 'Запланована сума закупівель і сума укладених договорів за кожен рік'
              }
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
