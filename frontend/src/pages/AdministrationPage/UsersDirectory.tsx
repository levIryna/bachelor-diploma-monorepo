import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useDepartmentDirectory } from '../../api/departments';
import { createUser, useManagedUsers, type UserCreateInput } from '../../api/users';
import { BigCard, Button, Loader } from '../../components';
import { getRoleLabel, ADMIN_ROLE, BUYER_ROLE, DEPARTMENT_HEAD_ROLE } from '../../mocks/roles';
import { paths } from '../../routes/paths';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}'’\s-]+$/u;
const ROLES = [ADMIN_ROLE, DEPARTMENT_HEAD_ROLE, BUYER_ROLE];

const emptyDraft: UserCreateInput = {
  email: '',
  fullName: '',
  role: BUYER_ROLE,
  departmentId: null,
  password: '',
  passwordConfirm: '',
};

function nameError(value: string): string {
  const name = value.trim();
  if (name.length === 0) {
    return '';
  }
  if (!NAME_PATTERN.test(name)) {
    return 'У ПІБ дозволені лише літери, пробіл, тире та апостроф';
  }
  const letters = name.match(/\p{L}/gu);
  if (!letters || letters.length < 2) {
    return 'ПІБ має містити щонайменше 2 літери';
  }
  return '';
}

function emailError(value: string): string {
  const email = value.trim();
  if (email.length === 0) {
    return '';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Вкажіть коректну електронну пошту';
  }
  return '';
}

function passwordError(password: string, confirm: string): string {
  if (password.length === 0 && confirm.length === 0) {
    return '';
  }
  if (password.length > 0 && password.length < 8) {
    return 'Пароль має містити від 8 до 72 символів';
  }
  if (confirm.length > 0 && password !== confirm) {
    return 'Паролі не збігаються';
  }
  return '';
}

function fieldClass(invalid: boolean): string {
  return [
    'w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2',
    invalid
      ? 'border-red-600 focus:ring-red-200'
      : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
  ].join(' ');
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Не вдалося створити користувача';
}

export function UsersDirectory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedUsers();
  const { data: departments } = useDepartmentDirectory();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<UserCreateInput>(emptyDraft);
  const [submitError, setSubmitError] = useState('');
  const [formError, setFormError] = useState('');

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      setCreating(false);
      setDraft(emptyDraft);
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      setFormError(errorText(error));
    },
  });

  const shownNameError = submitError === 'name' ? 'Вкажіть ПІБ' : nameError(draft.fullName);
  const shownEmailError = submitError === 'email' ? 'Вкажіть електронну пошту' : emailError(draft.email);
  const shownPasswordError =
    submitError === 'password' ? 'Вкажіть пароль від 8 до 72 символів' : passwordError(draft.password, draft.passwordConfirm);
  const shownDepartmentError =
    submitError === 'department' ? 'Для керівника підрозділу оберіть підрозділ' : '';

  function openCreate() {
    setCreating(true);
    setDraft(emptyDraft);
    setSubmitError('');
    setFormError('');
  }

  function submitCreate() {
    const email = draft.email.trim();
    const fullName = draft.fullName.trim();
    if (!email) {
      setSubmitError('email');
      return;
    }
    if (emailError(email) || nameError(fullName) || passwordError(draft.password, draft.passwordConfirm)) {
      setSubmitError('');
      return;
    }
    if (!fullName) {
      setSubmitError('name');
      return;
    }
    if (draft.password.length < 8 || draft.password !== draft.passwordConfirm) {
      setSubmitError('password');
      return;
    }
    if (draft.role === DEPARTMENT_HEAD_ROLE && !draft.departmentId) {
      setSubmitError('department');
      return;
    }
    setSubmitError('');
    setFormError('');
    create.mutate({
      ...draft,
      email,
      fullName,
      departmentId: draft.departmentId,
    });
  }

  return (
    <BigCard>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Користувачі</h2>
        <Button
          text="Додати"
          icon="plus"
          aria-label="Додати"
          className="h-9 w-9 shrink-0 px-0"
          onClick={openCreate}
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader size={28} />
        </div>
      ) : isError || !data ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">Не вдалося завантажити користувачів.</p>
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">Користувачів ще немає.</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          {data.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Info label="Пошта" value={user.email} />
                <Info label="ПІБ" value={user.fullName} />
                <Info label="Роль" value={getRoleLabel(user.role)} />
                <Info label="Підрозділ" value={user.departmentName ?? '—'} />
                <Info label="Статус" value={user.isActive ? 'Активний' : 'Пасивний'} active={user.isActive} />
              </div>
              <Button
                text="Деталі"
                variant="secondary"
                onClick={() => navigate(`${paths.administration}/users/${user.id}`)}
              />
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={() => {
            if (!create.isPending) {
              setCreating(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="create-user-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Новий користувач
            </h2>
            <Field label="Електронна пошта" error={shownEmailError}>
              <input
                autoFocus
                value={draft.email}
                disabled={create.isPending}
                aria-invalid={shownEmailError.length > 0}
                className={fieldClass(shownEmailError.length > 0)}
                onChange={(event) => {
                  setSubmitError('');
                  setFormError('');
                  setDraft((current) => ({ ...current, email: event.target.value }));
                }}
              />
            </Field>
            <Field label="ПІБ" error={shownNameError}>
              <input
                value={draft.fullName}
                maxLength={255}
                disabled={create.isPending}
                aria-invalid={shownNameError.length > 0}
                className={fieldClass(shownNameError.length > 0)}
                onChange={(event) => {
                  setSubmitError('');
                  setFormError('');
                  setDraft((current) => ({ ...current, fullName: event.target.value }));
                }}
              />
            </Field>
            <Field label="Роль" error="">
              <select
                value={draft.role}
                disabled={create.isPending}
                className={fieldClass(false)}
                onChange={(event) => {
                  setSubmitError('');
                  setDraft((current) => ({ ...current, role: event.target.value }));
                }}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Підрозділ" error={shownDepartmentError}>
              <select
                value={draft.departmentId ?? ''}
                disabled={create.isPending}
                aria-invalid={shownDepartmentError.length > 0}
                className={fieldClass(shownDepartmentError.length > 0)}
                onChange={(event) => {
                  setSubmitError('');
                  setDraft((current) => ({
                    ...current,
                    departmentId: event.target.value || null,
                  }));
                }}
              >
                <option value="">Без підрозділу</option>
                {(departments ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Пароль" error={shownPasswordError}>
              <input
                type="password"
                value={draft.password}
                autoComplete="new-password"
                disabled={create.isPending}
                aria-invalid={shownPasswordError.length > 0}
                className={fieldClass(shownPasswordError.length > 0)}
                onChange={(event) => {
                  setSubmitError('');
                  setFormError('');
                  setDraft((current) => ({ ...current, password: event.target.value }));
                }}
              />
            </Field>
            <Field label="Підтвердження пароля" error="">
              <input
                type="password"
                value={draft.passwordConfirm}
                autoComplete="new-password"
                disabled={create.isPending}
                className={fieldClass(shownPasswordError.length > 0)}
                onChange={(event) => {
                  setSubmitError('');
                  setFormError('');
                  setDraft((current) => ({ ...current, passwordConfirm: event.target.value }));
                }}
              />
            </Field>
            {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                text="Закрити"
                variant="secondary"
                disabled={create.isPending}
                onClick={() => setCreating(false)}
              />
              <Button text="Зберегти" disabled={create.isPending} onClick={submitCreate} />
            </div>
          </div>
        </div>
      ) : null}
    </BigCard>
  );
}

function Info({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p
        className={[
          'truncate text-sm font-medium',
          active === true
            ? 'text-green-700'
            : active === false
              ? 'text-slate-500'
              : 'text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
