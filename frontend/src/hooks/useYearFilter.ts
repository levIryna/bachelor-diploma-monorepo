import { useMemo, useState } from 'react';
import { useYears } from '../api/years';
import { useAppContext } from '../context/app-context';
import { toOptions } from '../utils/toOptions';

/** Same year list as the main page: all years after login, three latest for a guest. */
export function useYearFilter() {
  const { isAuthReady, isLoggedIn } = useAppContext();
  const yearsLimit = isLoggedIn ? undefined : 3;
  const { data: years, isLoading: isYearsQueryLoading } = useYears(yearsLimit, isAuthReady);
  const isYearsLoading = !isAuthReady || isYearsQueryLoading;
  const [year, setYear] = useState<string>();
  const selectedYear = year ?? years?.[0] ?? '';
  const yearItems = useMemo(() => toOptions(years ?? []), [years]);

  return {
    yearsLimit,
    selectedYear,
    setYear,
    yearItems,
    isYearsLoading,
  };
}
