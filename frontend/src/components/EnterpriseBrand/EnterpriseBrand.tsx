/**
 * Брендинг одного підприємства (не державний портал «Прозорі Закупівлі»).
 */
type EnterpriseBrandProps = {
  companyName: string;
  tagline?: string;
  className?: string;
};

export function EnterpriseBrand({
  companyName,
  tagline = 'Аналітика закупівель',
  className = '',
}: EnterpriseBrandProps) {
  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-600)] text-sm font-bold text-white shadow-sm"
      >
        {companyName.trim().charAt(0).toUpperCase() || 'З'}
      </div>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          {companyName}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {tagline}
        </span>
      </div>
    </div>
  );
}
