import { useMemo } from 'react';
import type { DropdownItem } from '../components/Dropdown/Dropdown';

/** Підрозділи (мок). Пізніше підключити `getDepartments`. */
export function useDepartments(): DropdownItem<string>[] {
  return useMemo(
    () => [
      { value: 'all', label: 'Усі підрозділи' },
      { value: 'procurement', label: 'Відділ закупівель' },
      { value: 'finance', label: 'Фінансовий відділ' },
      { value: 'legal', label: 'Юридичний відділ' },
    ],
    [],
  );
}
