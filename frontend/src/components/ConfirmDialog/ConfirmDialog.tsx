import { useEffect } from 'react';
import { Button } from '../Button/Button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  pending = false,
  error = '',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, pending]);

  if (!open) {
    return null;
  }

  function close() {
    if (!pending) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-bold text-[var(--color-text-primary)]"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{message}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            text="Скасувати"
            variant="secondary"
            disabled={pending}
            autoFocus
            onClick={close}
          />
          <Button text={confirmText} variant="danger" disabled={pending} onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
}
