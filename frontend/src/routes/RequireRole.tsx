import { Navigate, Outlet } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserAccess';
import { paths } from './paths';

type RequireRoleProps = {
  role?: string;
  roles?: string[];
};

export function RequireRole({ role, roles }: RequireRoleProps) {
  const userRole = useUserRole();
  const allowedRoles = roles ?? (role ? [role] : []);
  const allowed = allowedRoles.includes(userRole);

  if (!allowed) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
