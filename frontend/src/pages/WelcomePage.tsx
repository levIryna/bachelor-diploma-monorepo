import { Button, EnterpriseBrand } from '../components';

export function WelcomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-canvas)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <EnterpriseBrand companyName="ТОВ «Приклад»" />
          <Button text="Залогуватись" onClick={() => undefined} />
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Ласкаво просимо
        </h1>
        <p className="mt-4 text-[var(--color-text-muted)]">
          Увійдіть у систему, щоб переглядати аналітику та звіти з закупівель вашого підприємства.
        </p>
      </main>
    </div>
  );
}
