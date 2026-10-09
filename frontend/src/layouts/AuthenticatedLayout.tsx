import { Outlet } from 'react-router-dom';
import { EnterpriseBrand, Navigation, UserAccountBadge } from '../components';
import { getUserRole } from '../mocks/roles';
import { getUserInitials } from '../mocks/user';

export function AuthenticatedLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <EnterpriseBrand companyName="ТОВ «Приклад»" />
            <Navigation />
          </div>
          <UserAccountBadge initials={getUserInitials()} role={getUserRole()} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
