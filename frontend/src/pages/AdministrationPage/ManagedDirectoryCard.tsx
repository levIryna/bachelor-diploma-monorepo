import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { BigCard, Button, ConfirmDialog, Loader, TooltipIcon } from '../../components';
import { directoryNameError } from './directoryName';

export type ManagedDirectoryItem = {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
};

type ManagedDirectoryCardProps = {
  title: string;
  hint: string;
  emptyText: string;
  loadError: string;
  createTitle: string;
  createEmptyError: string;
  renameTitle: string;
  renameEmptyError: string;
  renameFailedError: string;
  deleteTitle: string;
  deleteMessage: (name: string) => string;
  deleteFailedError: string;
  deleteBlockedTitle: string;
  nameMaxLength?: number;
  allowDigits?: boolean;
  isAdmin: boolean;
  items: ManagedDirectoryItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onCreate: (name: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onSetActive: (id: string, isActive: boolean) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onChanged: () => Promise<unknown>;
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function ManagedDirectoryCard({
  title,
  hint,
  emptyText,
  loadError,
  createTitle,
  createEmptyError,
  renameTitle,
  renameEmptyError,
  renameFailedError,
  deleteTitle,
  deleteMessage,
  deleteFailedError,
  deleteBlockedTitle,
  nameMaxLength = 255,
  allowDigits = false,
  isAdmin,
  items,
  isLoading,
  isError,
  onCreate,
  onRename,
  onSetActive,
  onDelete,
  onChanged,
}: ManagedDirectoryCardProps) {
  const [editing, setEditing] = useState<ManagedDirectoryItem | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [renameError, setRenameError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState('');
  const [createError, setCreateError] = useState('');
  const [deleting, setDeleting] = useState<ManagedDirectoryItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const titleId = `rename-${title}`;
  const createTitleId = `create-${title}`;

  const create = useMutation({
    mutationFn: (name: string) => onCreate(name),
    onSuccess: async () => {
      setCreating(false);
      setCreateDraft('');
      setCreateError('');
      await onChanged();
    },
    onError: () => {
      setCreateError('Спробуйте пізніше.');
    },
  });

  const rename = useMutation({
    mutationFn: (input: { id: string; name: string }) => onRename(input.id, input.name),
    onSuccess: async () => {
      setEditing(null);
      setRenameError('');
      await onChanged();
    },
    onError: (error) => {
      setRenameError(errorMessage(error, renameFailedError));
    },
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => onSetActive(input.id, input.isActive),
    onSuccess: () => onChanged(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => onDelete(id),
    onSuccess: async () => {
      setDeleting(null);
      setDeleteError('');
      await onChanged();
    },
    onError: (error) => {
      setDeleteError(errorMessage(error, deleteFailedError));
    },
  });

  const shownCreateError = createError || directoryNameError(createDraft, allowDigits);

  const busyId =
    (rename.isPending ? rename.variables?.id : undefined) ??
    (setActive.isPending ? setActive.variables?.id : undefined) ??
    (remove.isPending ? remove.variables : undefined);

  function openCreate() {
    setCreating(true);
    setCreateDraft('');
    setCreateError('');
  }

  function submitCreate() {
    const name = createDraft.trim();
    if (name.length === 0) {
      setCreateError(createEmptyError);
      return;
    }
    const invalidName = directoryNameError(name, allowDigits);
    if (invalidName) {
      setCreateError(invalidName);
      return;
    }
    create.mutate(name);
  }

  function openRename(item: ManagedDirectoryItem) {
    setEditing(item);
    setNameDraft(item.name);
    setRenameError('');
  }

  function submitRename() {
    if (!editing) {
      return;
    }
    const name = nameDraft.trim();
    if (name.length === 0) {
      setRenameError(renameEmptyError);
      return;
    }
    rename.mutate({ id: editing.id, name });
  }

  return (
    <BigCard>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <TooltipIcon text={hint} />
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
      ) : isError || !items ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">{loadError}</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">{emptyText}</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          {items.map((item) => {
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
                    onClick={() => openRename(item)}
                  />
                  {isAdmin ? (
                    <Button
                      text="Видалити"
                      icon="trash"
                      variant="danger"
                      disabled={busy || !item.canDelete}
                      title={item.canDelete ? undefined : deleteBlockedTitle}
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
            aria-labelledby={createTitleId}
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={createTitleId} className="text-lg font-bold text-[var(--color-text-primary)]">
              {createTitle}
            </h2>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                Назва
              </span>
              <input
                autoFocus
                value={createDraft}
                maxLength={nameMaxLength}
                disabled={create.isPending}
                aria-invalid={shownCreateError.length > 0}
                className={`w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 ${
                  shownCreateError
                    ? 'border-red-600 focus:ring-red-200'
                    : 'border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]'
                }`}
                onChange={(event) => {
                  setCreateDraft(event.target.value);
                  setCreateError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    submitCreate();
                  }
                }}
              />
            </label>
            {shownCreateError ? <p className="mt-3 text-sm text-red-700">{shownCreateError}</p> : null}
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

      {editing ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
          onMouseDown={() => {
            if (!rename.isPending) {
              setEditing(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-primary)]">
              {renameTitle}
            </h2>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                Назва
              </span>
              <input
                autoFocus
                value={nameDraft}
                maxLength={nameMaxLength}
                disabled={rename.isPending}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    submitRename();
                  }
                }}
              />
            </label>
            {renameError ? <p className="mt-3 text-sm text-red-700">{renameError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                text="Скасувати"
                variant="secondary"
                disabled={rename.isPending}
                onClick={() => setEditing(null)}
              />
              <Button text="Зберегти" disabled={rename.isPending} onClick={submitRename} />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title={deleteTitle}
        message={deleting ? deleteMessage(deleting.name) : ''}
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
