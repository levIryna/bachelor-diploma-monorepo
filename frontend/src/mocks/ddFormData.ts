import { createEmptyDdForm, type DdFormData } from '../types/ddForm';
import { mockDdListItems } from './ddList';

export function getDdFormById(id: string): DdFormData | null {
  const row = mockDdListItems.find((item) => item.id === id);
  if (!row) {
    return null;
  }

  return {
    ...createEmptyDdForm(),
    year: row.year,
    number: row.number,
    rpzYearItem: `${row.year} · пункт ${row.item}`,
    subject: row.subject,
    procedure: row.procedure,
    contractor: row.counterparty,
    contractAmount: row.amount,
    contractDate: row.date,
  };
}
