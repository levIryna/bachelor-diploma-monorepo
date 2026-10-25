import type { DropdownItem } from '../components/Dropdown/Dropdown';

/** Turns `['2025', '2024']` into `[{ value: '2025', label: '2025' }, ...]`. */
export function toOptions<T extends string | number>(values: readonly T[]): DropdownItem<T>[] {
  return values.map((value) => ({ value, label: String(value) }));
}
