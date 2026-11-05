import { NavLink } from 'react-router-dom';
import { useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE, BUYER_ROLE } from '../../mocks/roles';
import { paths } from '../../routes/paths';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  hint?: string;
};

const commonTabs: NavItem[] = [
  { to: paths.home, label: 'Головна', end: true },
  { to: paths.rpz, label: 'РПЗ', hint: 'Річний план закупівель підприємства' },
  { to: paths.procurements, label: 'ДД', hint: 'Договірна документація' },
  { to: paths.reports, label: 'Аналітика' },
];

const adminTab: NavItem = {
  to: paths.administration,
  label: 'Адміністрування',
};

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'pb-4 pt-4 text-sm font-medium transition-colors border-b-2',
    isActive
      ? 'border-white text-white font-semibold'
      : 'border-transparent text-white/75 hover:text-white',
  ].join(' ');
}

export function Navigation() {
  const isAdmin = useHasRole(ADMIN_ROLE);
  const isBuyer = useHasRole(BUYER_ROLE);
  const tabs = isAdmin || isBuyer ? [...commonTabs, adminTab] : commonTabs;

  return (
    <nav aria-label="Головна навігація" className="hidden md:flex items-center gap-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          aria-label={tab.hint ? `${tab.label}. ${tab.hint}` : undefined}
          className={(state) => ['group relative', navLinkClass(state)].join(' ')}
        >
          {tab.label}
          {tab.hint ? (
            <span
              role="tooltip"
              className={[
                'pointer-events-none absolute top-full left-1/2 z-20 mt-1 hidden -translate-x-1/2',
                'whitespace-nowrap rounded-lg bg-[var(--color-tooltip-bg)] px-2.5 py-1.5',
                'text-xs font-medium text-[var(--color-tooltip-fg)] shadow-xl',
                'group-hover:block group-focus-visible:block',
              ].join(' ')}
            >
              {tab.hint}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
