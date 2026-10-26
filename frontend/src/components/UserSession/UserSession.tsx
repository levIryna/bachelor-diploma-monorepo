import { useAppContext } from '../../context/app-context';
import { getRoleLabel } from '../../mocks/roles';
import { getInitials } from '../../utils/getInitials';
import { Button } from '../Button/Button';
import { UserAccountBadge } from '../UserAccountBadge/UserAccountBadge';

export function UserSession() {
  const { user, logout } = useAppContext();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <UserAccountBadge initials={getInitials(user.fullName)} role={getRoleLabel(user.role)} />
      <Button text="Вийти" variant="onHeader" onClick={logout} />
    </div>
  );
}
