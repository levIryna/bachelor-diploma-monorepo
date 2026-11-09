import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { changeOwnPassword } from '../../api/auth';
import { BigCard, BlockedHint, Button, FormField } from '../../components';
import { useAppContext } from '../../context/app-context';
import type { Theme } from '../../context/app-context';
import { ADMIN_ROLE, getRoleLabel } from '../../mocks/roles';

const ADMIN_PASSWORD_BLOCKED = 'Пароль адміністратора не можна змінити через інтерфейс.';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
];

function currentPasswordError(value: string, showEmpty: boolean): string {
  if (value.length === 0) {
    return showEmpty ? 'Вкажіть поточний пароль' : '';
  }
  return '';
}

function newPasswordError(value: string, current: string, showEmpty: boolean): string {
  if (value.length === 0) {
    return showEmpty ? 'Вкажіть новий пароль' : '';
  }
  if (value.length < 8 || value.length > 72) {
    return 'Пароль має містити від 8 до 72 символів';
  }
  if (current.length > 0 && value === current) {
    return 'Новий пароль має відрізнятися від поточного';
  }
  return '';
}

function confirmPasswordError(password: string, confirm: string, showEmpty: boolean): string {
  if (confirm.length === 0) {
    return showEmpty ? 'Підтвердьте новий пароль' : '';
  }
  if (password !== confirm) {
    return 'Паролі не збігаються';
  }
  return '';
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Не вдалося змінити пароль';
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}

export function ProfilePage() {
  const { user, theme, setTheme } = useAppContext();
  const [open, setOpen] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => changeOwnPassword({ currentPassword, password, passwordConfirm }),
    onSuccess: () => {
      setOpen(false);
      setSaved(true);
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirm('');
      setShowEmpty(false);
      setFormError('');
    },
    onError: (error) => {
      setFormError(errorText(error));
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !save.isPending) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, save.isPending]);

  if (!user) {
    return null;
  }

  const currentMessage = currentPasswordError(currentPassword, showEmpty);
  const nextMessage = newPasswordError(password, currentPassword, showEmpty);
  const confirmMessage = confirmPasswordError(password, passwordConfirm, showEmpty);

  function closeDialog() {
    if (save.isPending) {
      return;
    }
    setOpen(false);
  }

  function submit() {
    setShowEmpty(true);
    setFormError('');
    if (
      currentPasswordError(currentPassword, true) ||
      newPasswordError(password, currentPassword, true) ||
      confirmPasswordError(password, passwordConfirm, true)
    ) {
      return;
    }
    save.mutate();
  }

  return (
    <div className="space-y-6">
      <BigCard>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Мій профіль</h1>
        <dl className="mt-4 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          <ProfileField label="ПІБ" value={user.fullName} />
          <ProfileField label="Електронна пошта" value={user.email} />
          <ProfileField label="Роль" value={getRoleLabel(user.role)} />
          <ProfileField label="Підрозділ" value={user.departmentName ?? '—'} />
        </dl>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Ці дані доступні лише для перегляду. Зміни можуть бути внесені лише адміністратором.
        </p>
      </BigCard>

      <BigCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Керування паролем</h2>
        <div className="mt-4">
          {user.role === ADMIN_ROLE ? (
            <BlockedHint text={ADMIN_PASSWORD_BLOCKED}>
              <Button text="Змінити пароль" disabled />
            </BlockedHint>
          ) : (
            <Button
              text="Змінити пароль"
              onClick={() => {
                setOpen(true);
                setSaved(false);
                setShowEmpty(false);
                setFormError('');
                setCurrentPassword('');
                setPassword('');
                setPasswordConfirm('');
              }}
            />
          )}
        </div>
        {saved ? <p className="mt-3 text-sm text-emerald-700">Пароль змінено.</p> : null}
      </BigCard>

      <BigCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Оформлення</h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-[var(--color-text-primary)]">Кольорова тема</legend>
          <div className="mt-3 inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.value;
              return (
                <label
                  key={option.value}
                  className={[
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]',
                    selected
                      ? 'bg-[var(--color-header)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-50)]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="color-theme"
                    className="sr-only"
                    value={option.value}
                    checked={selected}
                    onChange={() => setTheme(option.value)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </BigCard>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="change-password-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Зміна пароля
            </h2>
            <div className="mt-4 space-y-3">
              <FormField
                label="Поточний пароль"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={currentPassword}
                error={currentMessage}
                onChange={(value) => {
                  setCurrentPassword(value);
                  setFormError('');
                }}
              />
              <FormField
                label="Новий пароль"
                type="password"
                autoComplete="new-password"
                value={password}
                error={nextMessage}
                onChange={(value) => {
                  setPassword(value);
                  setFormError('');
                }}
              />
              <FormField
                label="Підтвердження пароля"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                error={confirmMessage}
                onChange={(value) => {
                  setPasswordConfirm(value);
                  setFormError('');
                }}
              />
            </div>
            {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button text="Скасувати" variant="secondary" disabled={save.isPending} onClick={closeDialog} />
              <Button text="Зберегти" disabled={save.isPending} onClick={submit} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
