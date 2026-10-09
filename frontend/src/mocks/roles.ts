/** Мок: чи відповідає передане значення актуальній ролі користувача. Поки завжди true. */
export function hasRole(role: string): boolean {
  void role;
  return true;
}

/** Значення ролі для вкладки «Адміністрування». */
export const ADMIN_ROLE = 'admin';
