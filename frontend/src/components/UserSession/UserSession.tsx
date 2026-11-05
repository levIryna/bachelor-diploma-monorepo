import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/app-context';
import { getRoleLabel } from '../../mocks/roles';
import { paths } from '../../routes/paths';
import { getInitials } from '../../utils/getInitials';
import { Button } from '../Button/Button';
import { UserAccountBadge } from '../UserAccountBadge/UserAccountBadge';

export function UserSession() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative" ref={menuRef}>
        <UserAccountBadge
          initials={getInitials(user.fullName)}
          expanded={open}
          onClick={() => setOpen((current) => !current)}
        />
        {open ? (
          <div
            role="dialog"
            aria-label="Обліковий запис"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-lg"
          >
            <p className="text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
              {user.fullName}
            </p>
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <p className="text-sm text-[var(--color-text-muted)]">{getRoleLabel(user.role)}</p>
              <Button
                text="Налаштування"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => {
                  setOpen(false);
                  navigate(paths.profile);
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <Button text="Вийти" variant="onHeader" onClick={logout} />
    </div>
  );
}
