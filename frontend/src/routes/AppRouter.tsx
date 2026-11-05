import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { MainPage } from '../pages/MainPage';
import { AdministrationPage } from '../pages/AdministrationPage';
import { ProfilePage } from '../pages/ProfilePage';
import { UserDetailPage } from '../pages/UserDetailPage/UserDetailPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { DdItemPage } from '../pages/DdItemPage';
import { DdListPage } from '../pages/DdListPage';
import { RpzItemPage } from '../pages/RpzItemPage';
import { RpzListPage } from '../pages/RpzListPage';
import { ADMIN_ROLE, BUYER_ROLE } from '../mocks/roles';
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
          <Route path={paths.rpz} element={<RpzListPage />} />
          <Route path={`${paths.rpz}/:id`} element={<RpzItemPage />} />
          <Route path={paths.procurements} element={<DdListPage />} />
          <Route path={`${paths.procurements}/:id`} element={<DdItemPage />} />
          <Route path={paths.reports} element={<AnalyticsPage />} />
          <Route path={paths.profile} element={<ProfilePage />} />
          <Route path={paths.analytics} element={<Navigate to={paths.reports} replace />} />
          <Route element={<RequireRole roles={[ADMIN_ROLE, BUYER_ROLE]} />}>
            <Route path={paths.administration} element={<AdministrationPage />} />
          </Route>
          <Route element={<RequireRole roles={[ADMIN_ROLE]} />}>
            <Route path={`${paths.administration}/users/:id`} element={<UserDetailPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
