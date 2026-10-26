import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { useAppContext } from '../../context/app-context';
import { Button } from '../Button/Button';
import { FormField } from '../FormField/FormField';

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  if (!open) {
    return null;
  }

  return <LoginForm onClose={onClose} />;
}

const EMPTY_FIELD_MESSAGE = 'Це поле не може бути пустим';
const INVALID_EMAIL_MESSAGE = 'Формат невірний';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(value: string) {
  if (!value) {
    return EMPTY_FIELD_MESSAGE;
  }
  if (!EMAIL_PATTERN.test(value)) {
    return INVALID_EMAIL_MESSAGE;
  }
  return '';
}

function passwordError(value: string) {
  return value ? '' : EMPTY_FIELD_MESSAGE;
}

function LoginForm({ onClose }: { onClose: () => void }) {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailMessage = showFieldErrors ? emailError(email) : '';
  const passwordMessage = showFieldErrors ? passwordError(password) : '';

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailError(email) || passwordError(password)) {
      setShowFieldErrors(true);
      setError('');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'Не вдалося увійти');
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="login-title" className="text-lg font-bold text-[var(--color-text-primary)]">
          Увійти
        </h2>
        <form className="mt-4 space-y-4" noValidate onSubmit={handleSubmit}>
          <FormField
            label="Електронна пошта"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            disabled={isSubmitting}
            error={emailMessage}
            rejectSpaces
            onChange={setEmail}
          />
          <FormField
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={isSubmitting}
            error={passwordMessage}
            rejectSpaces
            onChange={setPassword}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              text="Скасувати"
              variant="secondary"
              disabled={isSubmitting}
              onClick={onClose}
            />
            <Button
              text={isSubmitting ? 'Вхід...' : 'Увійти'}
              type="submit"
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
