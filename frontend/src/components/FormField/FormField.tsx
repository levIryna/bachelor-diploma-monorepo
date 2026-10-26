type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: 'text' | 'date' | 'email' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
  rejectSpaces?: boolean;
};

export function FormField({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  autoComplete,
  autoFocus = false,
  error = '',
  rejectSpaces = false,
}: FormFieldProps) {
  const invalid = error.length > 0;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        aria-invalid={invalid || undefined}
        onKeyDown={(event) => {
          if (rejectSpaces && event.key === ' ') {
            event.preventDefault();
          }
        }}
        onChange={(event) => {
          const next = rejectSpaces ? event.target.value.replace(/\s/g, '') : event.target.value;
          onChange(next);
        }}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'focus:outline-none focus:ring-2',
          invalid
            ? 'border-red-600 focus:ring-red-600'
            : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
          disabled
            ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
            : 'bg-[var(--color-surface)]',
        ].join(' ')}
      />
      {invalid ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
