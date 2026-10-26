import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '../components';
import { useAppContext } from '../context/app-context';
import { paths } from './paths';

export function RequireAuth() {
  const { isAuthReady, isLoggedIn } = useAppContext();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--color-canvas)]">
        <Loader size={28} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={paths.welcome} replace />;
  }

  return <Outlet />;
}
