import type { DropdownItem } from '../../components/Dropdown/Dropdown';

/** Список підрозділів підприємства. Пізніше — реальний HTTP-запит. */
export async function getDepartments(): Promise<DropdownItem<string>[]> {
  return [
    { value: 'all', label: 'Усі підрозділи' },
    { value: 'procurement', label: 'Відділ закупівель' },
    { value: 'finance', label: 'Фінансовий відділ' },
    { value: 'legal', label: 'Юридичний відділ' },
  ];
}
