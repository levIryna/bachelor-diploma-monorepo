import { Navigate, Outlet } from 'react-router-dom';
import { isUserLoggedIn } from '../mocks/auth';
import { paths } from './paths';

export function GuestOnly() {
  if (isUserLoggedIn()) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
