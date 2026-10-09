import { useMemo } from 'react';

/** П'ять останніх років (мок). Пізніше підключити `getAvailableYears`. */
export function useYears(): string[] {
  return useMemo(() => ['2025', '2024', '2023', '2022', '2021'], []);
}
