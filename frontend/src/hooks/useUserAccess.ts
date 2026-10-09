import { useAppContext } from '../context/AppContext';
import { ADMIN_ROLE, BUYER_ROLE } from '../mocks/roles';

export function useUserRole(): string {
  const { isLoggedIn, userRole } = useAppContext();
  return isLoggedIn ? userRole : '';
}

export function useHasRole(role: string): boolean {
  return useUserRole() === role;
}

export function useCanSelectDepartment(): boolean {
  const role = useUserRole();
  return role === ADMIN_ROLE || role === BUYER_ROLE;
}
