import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { MainPage } from '../pages/MainPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ADMIN_ROLE } from '../mocks/roles';
import { paths } from './paths';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

export function AppRouter() {
  return (
    <Routes>
      <Route path={paths.home} element={<MainPage />} />
      <Route path="/home" element={<Navigate to={paths.home} replace />} />

      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path={paths.analytics} element={<PlaceholderPage title="Аналітика" />} />
          <Route path={paths.procurements} element={<PlaceholderPage title="Закупівлі" />} />
          <Route path={paths.reports} element={<PlaceholderPage title="Звіти" />} />
          <Route element={<RequireRole role={ADMIN_ROLE} />}>
            <Route
              path={paths.administration}
              element={<PlaceholderPage title="Адміністрування" />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
