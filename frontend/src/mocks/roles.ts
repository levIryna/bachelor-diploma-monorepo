/** Значення ролей у системі. */
export const ADMIN_ROLE = 'admin';
export const DEPARTMENT_HEAD_ROLE = 'department_head';
export const BUYER_ROLE = 'buyer';

const ROLE_LABELS: Record<string, string> = {
  [ADMIN_ROLE]: 'Адміністратор',
  [DEPARTMENT_HEAD_ROLE]: 'Керівник підрозділу',
  [BUYER_ROLE]: 'Закупівельник',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
