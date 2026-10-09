import { useState } from 'react';
import { BigCard, BigCardHeader, Dropdown, KpiCard, TooltipIcon } from '../components';

export function HomePage() {
  const [year, setYear] = useState('2025');

  return (
    <>
      <section className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">KPI</h1>
          <TooltipIcon text="KPI (Key Performance Indicators) — ключові показники ефективності закупівель підприємства." />
          <Dropdown
            ariaLabel="Обрати рік"
            items={[
              { value: '2025', label: '2025' },
              { value: '2024', label: '2024' },
              { value: '2023', label: '2023' },
            ]}
            value={year}
            onChange={setYear}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Заплановано — сума"
            value="124 580 тис. грн"
            description="Річний затверджений бюджет"
          />
          <KpiCard title="Закупівель у плані — сума" value="892" description="Зареєстрованих процедур" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BigCard>
          <BigCardHeader
            title="Статус закупівель"
            description={`Дані за ${year} рік`}
            dropdown={
              <Dropdown
                ariaLabel="Рік для статусу"
                items={[{ value: year, label: year }]}
                value={year}
                onChange={setYear}
              />
            }
          />
        </BigCard>
        <BigCard>
          <BigCardHeader
            title="Динаміка за останні 5 років"
            description="Порівняння планових асигнувань та факту виконання"
          />
        </BigCard>
      </div>
    </>
  );
}
