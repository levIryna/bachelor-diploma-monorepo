type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: 'text' | 'date';
};

export function FormField({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
          disabled
            ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
            : 'bg-[var(--color-surface)]',
        ].join(' ')}
      />
    </label>
  );
}
