type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = 'Пошук…',
  ariaLabel = 'Пошук',
  className = '',
}: SearchFieldProps) {
  return (
    <input
      type="search"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={[
        'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2',
        'text-sm text-[var(--color-text-primary)] shadow-sm placeholder:text-[var(--color-text-placeholder)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
        className,
      ].join(' ')}
    />
  );
}
