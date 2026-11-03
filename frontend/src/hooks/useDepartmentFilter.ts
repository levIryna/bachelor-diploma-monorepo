import { useMemo, useState } from 'react';
import { useDepartmentDirectory } from '../api/departments';
import { useAppContext } from '../context/app-context';
import { useCanSelectDepartment } from './useUserAccess';

/** Same department list as the main page: all units for admin and buyer, own unit locked for a department head. */
export function useDepartmentFilter() {
  const { isLoggedIn, user } = useAppContext();
  const canSelectDepartment = useCanSelectDepartment();
  const departmentLocked = isLoggedIn && !canSelectDepartment;
  const { data: departmentDirectory, isLoading: isDepartmentsLoading } = useDepartmentDirectory(
    isLoggedIn,
    user?.id,
  );
  const [departmentChoice, setDepartment] = useState('all');
  const departmentItems = useMemo(() => {
    const options = (departmentDirectory ?? []).map((department) => ({
      value: department.id,
      label: department.name,
    }));
    if (departmentLocked) {
      return options;
    }
    return [{ value: 'all', label: 'Усі підрозділи' }, ...options];
  }, [departmentDirectory, departmentLocked]);
  const selectedDepartment = departmentLocked ? (user?.departmentId ?? '') : departmentChoice;
  const departmentId =
    isLoggedIn && selectedDepartment && selectedDepartment !== 'all' ? selectedDepartment : undefined;
  const departmentReady = !departmentLocked || Boolean(user?.departmentId);
  const selectedDepartmentLabel =
    departmentItems.find((item) => item.value === selectedDepartment)?.label ?? '';
  const departmentValue = departmentItems.some((item) => item.value === selectedDepartment)
    ? selectedDepartment
    : (departmentItems[0]?.value ?? '');

  return {
    departmentItems,
    selectedDepartment,
    setDepartment,
    departmentId,
    departmentReady,
    selectedDepartmentLabel,
    departmentLocked,
    isDepartmentsLoading,
    departmentValue,
  };
}
