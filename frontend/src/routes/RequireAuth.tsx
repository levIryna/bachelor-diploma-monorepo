import { Navigate, Outlet } from 'react-router-dom';
import { isUserLoggedIn } from '../mocks/auth';
import { paths } from './paths';

export function RequireAuth() {
  if (!isUserLoggedIn()) {
    return <Navigate to={paths.welcome} replace />;
  }

  return <Outlet />;
}
