import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import {
  createContractor,
  deleteContractor,
  updateContractor,
  updateContractorActive,
  useManagedContractors,
  type ContractorInput,
  type ManagedContractor,
} from '../../api/contractors';
import { BigCard, Button, ConfirmDialog, Loader, TooltipIcon } from '../../components';

const EDRPOU_PATTERN = /^(?:\d{8}|\d{10})$/;
const CONTRACTOR_NAME_PATTERN = /^[\p{L}"«»&\s\-—]+$/u;

function contractorNameError(name: string): string {
  const value = name.trim();
  if (value.length === 0) {
    return '';
  }
  if (!CONTRACTOR_NAME_PATTERN.test(value)) {
    return 'Дозволені лише літери, лапки, пробіл, тире та &';
  }
  const letters = value.match(/\p{L}/gu);
  if (!letters || letters.length < 2) {
    return 'Назва має містити щонайменше 2 літери';
  }
  return '';
}

function edrpouError(edrpou: string): string {
  const value = edrpou.trim();
  if (value.length === 0) {
    return '';
  }
  if (!EDRPOU_PATTERN.test(value)) {
    return 'ЄДРПОУ має містити 8 або 10 цифр';
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

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function draftFrom(item: ManagedContractor | null): ContractorInput {
  return {
    name: item?.name ?? '',
    edrpou: item?.edrpou ?? '',
  };
}

export function ContractorsDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedContractors();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedContractor | null>(null);
  const [draft, setDraft] = useState<ContractorInput>(draftFrom(null));
  const [formError, setFormError] = useState('');
  const [nameSubmitError, setNameSubmitError] = useState('');
  const [deleting, setDeleting] = useState<ManagedContractor | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['contractors'] });

  const create = useMutation({
    mutationFn: createContractor,
    onSuccess: async () => {
      setCreating(false);
      setFormError('');
      await refresh();
    },
    onError: () => {
      setFormError('Спробуйте пізніше.');
    },
  });

  const save = useMutation({
    mutationFn: (input: ContractorInput) => updateContractor(editing?.id ?? '', input),
    onSuccess: async () => {
      setEditing(null);
      setFormError('');
      await refresh();
    },
    onError: (error) => {
      setFormError(errorMessage(error, 'Не вдалося зберегти контрагента'));
    },
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      updateContractorActive(input.id, input.isActive),
    onSuccess: () => refresh(),
  });

  const remove = useMutation({
    mutationFn: deleteContractor,
    onSuccess: async () => {
      setDeleting(null);
      setDeleteError('');
      await refresh();
    },
    onError: (error) => {
      setDeleteError(errorMessage(error, 'Не вдалося видалити контрагента'));
    },
  });

  const formPending = create.isPending || save.isPending;
  const busyId =
    (save.isPending ? editing?.id : undefined) ??
    (setActive.isPending ? setActive.variables?.id : undefined) ??
    (remove.isPending ? remove.variables : undefined);

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setDraft(draftFrom(null));
    setFormError('');
    setNameSubmitError('');
  }

  function openEdit(item: ManagedContractor) {
    setEditing(item);
    setCreating(false);
    setDraft(draftFrom(item));
    setFormError('');
    setNameSubmitError('');
  }

  function closeForm() {
    if (formPending) {
      return;
    }
    setCreating(false);
    setEditing(null);
    setFormError('');
    setNameSubmitError('');
  }

  function submitForm() {
    const name = draft.name.trim();
    const edrpou = draft.edrpou.trim();
    if (name.length === 0) {
      setNameSubmitError('Вкажіть назву контрагента');
      setFormError('');
      return;
    }
    if (contractorNameError(name) || edrpouError(edrpou)) {
      setNameSubmitError('');
      setFormError('');
      return;
    }
    const input = { name, edrpou };
    if (creating) {
      create.mutate(input);
      return;
    }
    if (editing) {
      save.mutate(input);
    }
  }

  const formOpen = creating || editing !== null;
  const shownNameError = nameSubmitError || contractorNameError(draft.name);
  const shownEdrpouError = edrpouError(draft.edrpou);

  return (
    <BigCard>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Контрагенти</h2>
          <TooltipIcon text="Лише активний контрагент доступний при створенні договорів" />
        </div>
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
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">
          Не вдалося завантажити контрагентів.
        </p>
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">Контрагентів ще немає.</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          {data.map((item) => {
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.name}
                  </p>
                  {item.edrpou ? (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      ЄДРПОУ: {item.edrpou}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Статус:{' '}
                    <span
                      className={
                        item.isActive ? 'font-medium text-green-700' : 'font-medium text-slate-500'
                      }
                    >
                      {item.isActive ? 'Активний' : 'Пасивний'}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    text="Редагувати"
                    icon="edit"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openEdit(item)}
                  />
                  {isAdmin ? (
                    <Button
                      text="Видалити"
                      icon="trash"
                      variant="danger"
                      disabled={busy || !item.canDelete}
                      title={
                        item.canDelete
                          ? undefined
                          : 'Контрагент уже використовується, тому його не можна видалити'
                      }
                      onClick={() => {
                        setDeleting(item);
                        setDeleteError('');
                      }}
                    />
                  ) : null}
                  <Button
                    text={item.isActive ? 'Дезактивувати' : 'Активувати'}
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setActive.mutate({ id: item.id, isActive: !item.isActive })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={closeForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contractor-form-title"
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2
              id="contractor-form-title"
              className="text-lg font-bold text-[var(--color-text-primary)]"
            >
              {creating ? 'Новий контрагент' : 'Редагувати контрагента'}
            </h2>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                Назва
              </span>
              <input
                autoFocus
                value={draft.name}
                maxLength={512}
                disabled={formPending}
                aria-invalid={shownNameError.length > 0}
                className={fieldClass(shownNameError.length > 0)}
                onChange={(event) => {
                  setNameSubmitError('');
                  setFormError('');
                  setDraft((current) => ({ ...current, name: event.target.value }));
                }}
              />
            </label>
            {shownNameError ? <p className="mt-2 text-sm text-red-700">{shownNameError}</p> : null}
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                ЄДРПОУ
              </span>
              <input
                value={draft.edrpou}
                maxLength={10}
                inputMode="numeric"
                disabled={formPending}
                aria-invalid={shownEdrpouError.length > 0}
                className={fieldClass(shownEdrpouError.length > 0)}
                onChange={(event) => {
                  setFormError('');
                  setDraft((current) => ({ ...current, edrpou: event.target.value }));
                }}
              />
            </label>
            {shownEdrpouError ? (
              <p className="mt-2 text-sm text-red-700">{shownEdrpouError}</p>
            ) : null}
            {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                text={creating ? 'Закрити' : 'Скасувати'}
                variant="secondary"
                disabled={formPending}
                onClick={closeForm}
              />
              <Button text="Зберегти" disabled={formPending} onClick={submitForm} />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Видалити контрагента"
        message={
          deleting ? `Видалити контрагента «${deleting.name}»? Цю дію не можна скасувати.` : ''
        }
        confirmText="Видалити"
        pending={remove.isPending}
        error={deleteError}
        onClose={() => {
          if (!remove.isPending) {
            setDeleting(null);
            setDeleteError('');
          }
        }}
        onConfirm={() => {
          if (deleting) {
            remove.mutate(deleting.id);
          }
        }}
      />
    </BigCard>
  );
}
