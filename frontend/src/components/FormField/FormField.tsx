import { useState } from 'react';

const EMPTY_FIELD_MARK = 'н/д';

function groupThousands(value: string): string {
  const digits = value.replace(/\D/g, '');
  const withoutLeadingZeros = digits.replace(/^0+/, '');
  const shown = withoutLeadingZeros || (digits ? '0' : '');
  return shown.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function caretAfterDigits(grouped: string, digitCount: number): number {
  if (digitCount <= 0) {
    return 0;
  }
  let seen = 0;
  for (let index = 0; index < grouped.length; index += 1) {
    if (/\d/.test(grouped[index] ?? '')) {
      seen += 1;
      if (seen === digitCount) {
        return index + 1;
      }
    }
  }
  return grouped.length;
}

function EyeIcon({ shown }: { shown: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shown ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7a12 12 0 0 1-4.6 5.4" />
          <path d="M6.1 6.1C4.2 7.4 2.6 9.3 1 12c1.7 3.9 6 7 10.4 7 1.5 0 2.9-.3 4.2-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  className: string;
  rejectSpaces?: boolean;
};

export function PasswordInput({
  value,
  onChange,
  disabled = false,
  autoComplete,
  autoFocus = false,
  invalid = false,
  className,
  rejectSpaces = false,
}: PasswordInputProps) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        type={shown ? 'text' : 'password'}
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
        className={[className, 'pr-10'].join(' ')}
      />
      <button
        type="button"
        aria-label={shown ? 'Сховати пароль' : 'Показати пароль'}
        aria-pressed={shown}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setShown((current) => !current)}
      >
        <EyeIcon shown={shown} />
      </button>
    </div>
  );
}

type FormSelectItem = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  value: string;
  items: readonly FormSelectItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
};

export function FormSelect({
  label,
  value,
  items,
  onChange,
  disabled = false,
  isLoading = false,
  placeholder = '',
  error = '',
  id,
}: FormSelectProps) {
  const inactive = disabled || isLoading;
  const invalid = error.length > 0;
  const emptyPlaceholder =
    disabled && value.trim() === '' && !isLoading ? EMPTY_FIELD_MARK : placeholder;

  return (
    <label id={id} className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <div className="relative">
        <select
          aria-label={label}
          aria-busy={isLoading}
          aria-invalid={invalid || undefined}
          disabled={inactive}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            'w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm',
            'focus:outline-none focus:ring-2',
            invalid
              ? 'border-red-600 focus:ring-red-600'
              : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
            inactive
              ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
              : 'cursor-pointer bg-[var(--color-surface)] text-[var(--color-text-primary)]',
          ].join(' ')}
        >
          {emptyPlaceholder ? (
            <option value="" disabled={value.length > 0}>
              {emptyPlaceholder}
            </option>
          ) : null}
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          ▾
        </span>
      </div>
      {invalid ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

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
  digitsOnly?: boolean;
  groupThousands?: boolean;
  suffix?: string;
  id?: string;
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
  digitsOnly = false,
  groupThousands: groupDigits = false,
  suffix = '',
  id,
}: FormFieldProps) {
  const invalid = error.length > 0;
  const showEmptyMark = disabled && value.trim() === '';
  const displayType = showEmptyMark && type === 'date' ? 'text' : type;
  const numeric = digitsOnly || groupDigits;
  const displayValue = showEmptyMark
    ? EMPTY_FIELD_MARK
    : groupDigits
      ? groupThousands(value)
      : value;

  const inputClassName = [
    'w-full rounded-lg border px-3 py-2 text-sm text-[var(--color-text-primary)]',
    'focus:outline-none focus:ring-2',
    invalid
      ? 'border-red-600 focus:ring-red-600'
      : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
    suffix ? 'pr-12' : '',
    disabled
      ? 'cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
      : 'bg-[var(--color-surface)]',
  ].join(' ');

  return (
    <label id={id} className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      {type === 'password' && !showEmptyMark ? (
        <PasswordInput
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          invalid={invalid}
          rejectSpaces={rejectSpaces}
          className={inputClassName}
        />
      ) : (
        <div className="relative">
          <input
            type={displayType}
            inputMode={numeric ? 'numeric' : undefined}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={disabled}
            value={displayValue}
            aria-invalid={invalid || undefined}
            onKeyDown={(event) => {
              if ((rejectSpaces || groupDigits) && event.key === ' ') {
                event.preventDefault();
              }
            }}
            onChange={(event) => {
              const input = event.target;
              const raw = input.value;
              const caret = input.selectionStart ?? raw.length;
              const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
              let next = raw;
              if (groupDigits) {
                next = groupThousands(raw);
              } else if (digitsOnly) {
                next = raw.replace(/\D/g, '');
              } else if (rejectSpaces) {
                next = raw.replace(/\s/g, '');
              }
              onChange(next);
              if (groupDigits) {
                const nextCaret = caretAfterDigits(next, digitsBeforeCaret);
                requestAnimationFrame(() => {
                  input.setSelectionRange(nextCaret, nextCaret);
                });
              }
            }}
            className={inputClassName}
          />
          {suffix && !showEmptyMark ? (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--color-text-placeholder)] select-none"
            >
              {suffix}
            </span>
          ) : null}
        </div>
      )}
      {invalid ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
