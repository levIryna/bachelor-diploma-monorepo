import { useAppContext } from '../context/app-context';
import { ADMIN_ROLE, BUYER_ROLE } from '../mocks/roles';

export function useUserRole(): string {
  const { user } = useAppContext();
  return user?.role ?? '';
}

export function useHasRole(role: string): boolean {
  return useUserRole() === role;
}

export function useCanSelectDepartment(): boolean {
  const role = useUserRole();
  return role === ADMIN_ROLE || role === BUYER_ROLE;
}
