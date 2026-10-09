import { Navigate, Outlet } from 'react-router-dom';
import { useHasRole } from '../hooks/useUserAccess';
import { paths } from './paths';

type RequireRoleProps = {
  role: string;
};

export function RequireRole({ role }: RequireRoleProps) {
  const allowed = useHasRole(role);

  if (!allowed) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
