import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useDepartmentDirectory } from '../../api/departments';
import {
  deleteUser,
  updateUser,
  updateUserPassword,
  useManagedUser,
  type ManagedUser,
  type UserFieldPatch,
} from '../../api/users';
import { BigCard, BlockedHint, Button, ConfirmDialog, Loader } from '../../components';
import { ADMIN_ROLE, BUYER_ROLE, DEPARTMENT_HEAD_ROLE, getRoleLabel } from '../../mocks/roles';
import { paths } from '../../routes/paths';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}'’\s-]+$/u;
const ROLES = [ADMIN_ROLE, DEPARTMENT_HEAD_ROLE, BUYER_ROLE];
const PASSWORD_MASK = '••••••••';
const ADMIN_PASSWORD_BLOCKED = 'Пароль адміністратора не можна змінити через інтерфейс.';

type EditTarget = 'email' | 'fullName' | 'role' | 'department' | 'status' | 'password';

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function fieldClass(invalid: boolean): string {
  return [
    'w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2',
    invalid
      ? 'border-red-600 focus:ring-red-200'
      : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]',
  ].join(' ');
}

export function UserDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedUser(id);
  const { data: departments } = useDepartmentDirectory();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const save = useMutation({
    mutationFn: (patch: UserFieldPatch) => updateUser(id, patch),
    onSuccess: async () => {
      setEditing(null);
      setFormError('');
      await refresh();
    },
    onError: (error) => {
      setFormError(errorText(error, 'Не вдалося зберегти зміни'));
    },
  });

  const savePassword = useMutation({
    mutationFn: () => updateUserPassword(id, { password, passwordConfirm, adminPassword }),
    onSuccess: async () => {
      setEditing(null);
      setFormError('');
      setPassword('');
      setPasswordConfirm('');
      setAdminPassword('');
      await refresh();
    },
    onError: (error) => {
      setFormError(errorText(error, 'Не вдалося змінити пароль'));
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteUser(id),
    onSuccess: async () => {
      await refresh();
      navigate(`${paths.administration}?tab=users`);
    },
    onError: (error) => {
      setDeleteError(errorText(error, 'Не вдалося видалити користувача'));
    },
  });

  function openEdit(target: EditTarget, user: ManagedUser) {
    if (target === 'password' && user.role === ADMIN_ROLE) {
      return;
    }
    setEditing(target);
    setFormError('');
    setDraft(target === 'email' ? user.email : target === 'fullName' ? user.fullName : user.role);
    setDepartmentId(user.departmentId ?? '');
    setIsActive(user.isActive);
    setPassword('');
    setPasswordConfirm('');
    setAdminPassword('');
  }

  function submitEdit(user: ManagedUser) {
    if (editing === 'email') {
      const email = draft.trim();
      if (!EMAIL_PATTERN.test(email)) {
        setFormError('Вкажіть коректну електронну пошту');
        return;
      }
      save.mutate({ email });
      return;
    }
    if (editing === 'fullName') {
      const fullName = draft.trim();
      if (!NAME_PATTERN.test(fullName) || (fullName.match(/\p{L}/gu)?.length ?? 0) < 2) {
        setFormError('У ПІБ дозволені лише літери, пробіл, тире та апостроф, щонайменше 2 літери');
        return;
      }
      save.mutate({ fullName });
      return;
    }
    if (editing === 'role') {
      if (draft === DEPARTMENT_HEAD_ROLE && !user.departmentId) {
        setFormError('Спочатку оберіть підрозділ для керівника');
        return;
      }
      save.mutate({ role: draft });
      return;
    }
    if (editing === 'department') {
      if (user.role === DEPARTMENT_HEAD_ROLE && !departmentId) {
        setFormError('Для керівника підрозділу оберіть підрозділ');
        return;
      }
      save.mutate({ departmentId: departmentId || null });
      return;
    }
    if (editing === 'status') {
      save.mutate({ isActive });
      return;
    }
    if (editing === 'password') {
      if (password.length < 8 || password.length > 72) {
        setFormError('Пароль має містити від 8 до 72 символів');
        return;
      }
      if (password !== passwordConfirm) {
        setFormError('Паролі не збігаються');
        return;
      }
      if (!adminPassword) {
        setFormError('Вкажіть пароль адміністратора');
        return;
      }
      savePassword.mutate();
    }
  }

  const pending = save.isPending || savePassword.isPending;
  const createdAt = data
    ? new Date(data.createdAt).toLocaleString('uk-UA', { dateStyle: 'long', timeStyle: 'short' })
    : '';

  return (
    <div className="space-y-6">
      <Link
        to={`${paths.administration}?tab=users`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
      >
        <span aria-hidden="true">←</span>
        Назад до користувачів
      </Link>

      {isLoading ? (
        <BigCard>
          <div className="flex h-40 items-center justify-center">
            <Loader size={28} />
          </div>
        </BigCard>
      ) : isError || !data ? (
        <BigCard>
          <p className="text-sm text-[var(--color-text-muted)]">Не вдалося завантажити користувача.</p>
        </BigCard>
      ) : (
        <BigCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {data.fullName}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{data.email}</p>
            </div>
            {data.role === ADMIN_ROLE ? null : (
              <Button
                text="Видалити"
                variant="danger"
                disabled={!data.canDelete || remove.isPending}
                title={
                  data.canDelete
                    ? undefined
                    : 'Користувач уже використовується, тому його не можна видалити'
                }
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteError('');
                }}
              />
            )}
          </div>

          <dl className="mt-6 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
            <FieldRow label="Електронна пошта" value={data.email} onEdit={() => openEdit('email', data)} />
            <FieldRow label="ПІБ" value={data.fullName} onEdit={() => openEdit('fullName', data)} />
            <FieldRow label="Роль" value={getRoleLabel(data.role)} onEdit={() => openEdit('role', data)} />
            <FieldRow
              label="Підрозділ"
              value={data.departmentName ?? '—'}
              onEdit={() => openEdit('department', data)}
            />
            <FieldRow
              label="Статус"
              value={data.isActive ? 'Активний' : 'Пасивний'}
              onEdit={() => openEdit('status', data)}
            />
            <FieldRow
              label="Пароль"
              value={PASSWORD_MASK}
              onEdit={() => openEdit('password', data)}
              editBlockedReason={data.role === ADMIN_ROLE ? ADMIN_PASSWORD_BLOCKED : undefined}
            />
            <div className="px-4 py-3">
              <dt className="text-xs text-[var(--color-text-muted)]">Створено</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{createdAt}</dd>
            </div>
          </dl>
        </BigCard>
      )}

      {editing && data ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={() => {
            if (!pending) {
              setEditing(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {editing === 'password' ? 'Новий пароль' : 'Редагувати поле'}
            </h2>
            {editing === 'password' ? (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Поточний пароль не показується. Можна встановити лише новий пароль. Для підтвердження
                дії вкажіть пароль адміністратора.
              </p>
            ) : null}
            {editing === 'email' ? (
              <DialogField label="Електронна пошта">
                <input
                  autoFocus
                  value={draft}
                  disabled={pending}
                  className={fieldClass(formError.length > 0)}
                  onChange={(event) => {
                    setFormError('');
                    setDraft(event.target.value);
                  }}
                />
              </DialogField>
            ) : null}
            {editing === 'fullName' ? (
              <DialogField label="ПІБ">
                <input
                  autoFocus
                  value={draft}
                  maxLength={255}
                  disabled={pending}
                  className={fieldClass(formError.length > 0)}
                  onChange={(event) => {
                    setFormError('');
                    setDraft(event.target.value);
                  }}
                />
              </DialogField>
            ) : null}
            {editing === 'role' ? (
              <DialogField label="Роль">
                <select
                  autoFocus
                  value={draft}
                  disabled={pending}
                  className={fieldClass(false)}
                  onChange={(event) => {
                    setFormError('');
                    setDraft(event.target.value);
                  }}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </DialogField>
            ) : null}
            {editing === 'department' ? (
              <DialogField label="Підрозділ">
                <select
                  autoFocus
                  value={departmentId}
                  disabled={pending}
                  className={fieldClass(formError.length > 0)}
                  onChange={(event) => {
                    setFormError('');
                    setDepartmentId(event.target.value);
                  }}
                >
                  <option value="">Без підрозділу</option>
                  {(departments ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </DialogField>
            ) : null}
            {editing === 'status' ? (
              <DialogField label="Статус">
                <select
                  autoFocus
                  value={isActive ? 'active' : 'passive'}
                  disabled={pending}
                  className={fieldClass(false)}
                  onChange={(event) => {
                    setFormError('');
                    setIsActive(event.target.value === 'active');
                  }}
                >
                  <option value="active">Активний</option>
                  <option value="passive">Пасивний</option>
                </select>
              </DialogField>
            ) : null}
            {editing === 'password' ? (
              <>
                <DialogField label="Новий пароль">
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    autoComplete="new-password"
                    disabled={pending}
                    className={fieldClass(formError.length > 0)}
                    onChange={(event) => {
                      setFormError('');
                      setPassword(event.target.value);
                    }}
                  />
                </DialogField>
                <DialogField label="Підтвердження пароля">
                  <input
                    type="password"
                    value={passwordConfirm}
                    autoComplete="new-password"
                    disabled={pending}
                    className={fieldClass(formError.length > 0)}
                    onChange={(event) => {
                      setFormError('');
                      setPasswordConfirm(event.target.value);
                    }}
                  />
                </DialogField>
                <DialogField label="Пароль адміністратора">
                  <input
                    type="password"
                    value={adminPassword}
                    autoComplete="current-password"
                    disabled={pending}
                    className={fieldClass(formError.length > 0)}
                    onChange={(event) => {
                      setFormError('');
                      setAdminPassword(event.target.value);
                    }}
                  />
                </DialogField>
              </>
            ) : null}
            {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button text="Скасувати" variant="secondary" disabled={pending} onClick={() => setEditing(null)} />
              <Button text="Зберегти" disabled={pending} onClick={() => submitEdit(data)} />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Видалити користувача"
        message={data ? `Видалити користувача «${data.fullName}»? Цю дію не можна скасувати.` : ''}
        confirmText="Видалити"
        pending={remove.isPending}
        error={deleteError}
        onClose={() => {
          if (!remove.isPending) {
            setDeleteOpen(false);
            setDeleteError('');
          }
        }}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

function FieldRow({
  label,
  value,
  onEdit,
  editBlockedReason,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  editBlockedReason?: string;
}) {
  const editButton = (
    <Button
      text="Редагувати"
      icon="edit"
      variant="secondary"
      disabled={Boolean(editBlockedReason)}
      onClick={onEdit}
    />
  );

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
        <dd className="mt-1 truncate text-sm font-medium text-[var(--color-text-primary)]">{value}</dd>
      </div>
      {editBlockedReason ? <BlockedHint text={editBlockedReason}>{editButton}</BlockedHint> : editButton}
    </div>
  );
}

function DialogField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
