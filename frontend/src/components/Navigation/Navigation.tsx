import { NavLink } from 'react-router-dom';
import { useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE } from '../../mocks/roles';
import { paths } from '../../routes/paths';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const commonTabs: NavItem[] = [
  { to: paths.home, label: 'Головна', end: true },
  { to: paths.rpz, label: 'РПЗ' },
  { to: paths.procurements, label: 'ДД' },
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
      ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-semibold'
      : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
  ].join(' ');
}

export function Navigation() {
  const isAdmin = useHasRole(ADMIN_ROLE);
  const tabs = isAdmin ? [...commonTabs, adminTab] : commonTabs;

  return (
    <nav aria-label="Головна навігація" className="hidden md:flex items-center gap-6">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={navLinkClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
