import { Navigate, Outlet } from 'react-router-dom';
import { hasRole } from '../mocks/roles';
import { paths } from './paths';

type RequireRoleProps = {
  role: string;
};

export function RequireRole({ role }: RequireRoleProps) {
  if (!hasRole(role)) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
