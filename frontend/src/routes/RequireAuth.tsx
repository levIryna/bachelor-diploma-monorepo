import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { paths } from './paths';

export function RequireAuth() {
  const { isLoggedIn } = useAppContext();

  if (!isLoggedIn) {
    return <Navigate to={paths.welcome} replace />;
  }

  return <Outlet />;
}
