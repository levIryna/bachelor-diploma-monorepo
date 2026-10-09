import { isUserLoggedIn } from './auth';

/** Значення ролей у системі. */
export const ADMIN_ROLE = 'admin';
export const BUYER_ROLE = 'buyer';

/** Мок: поточна роль користувача. Пізніше — з API / токена. */
export function getUserRole(): string {
  if (!isUserLoggedIn()) {
    return '';
  }

  return 'admin';
}

/** Чи відповідає передана роль поточній ролі користувача. */
export function hasRole(role: string): boolean {
  return getUserRole() === role;
}

export function canSelectDepartment(): boolean {
  const role = getUserRole();
  return role === ADMIN_ROLE || role === BUYER_ROLE;
}
