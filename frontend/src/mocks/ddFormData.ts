import { createEmptyDdForm, type DdFormData } from '../types/ddForm';
import { mockDdListItems } from './ddList';

const detailById: Record<string, Partial<DdFormData>> = {
  '1': {
    orderNumber: '1',
    rpzYearItem: '2025 · пункт 014',
    procurementSubject: 'Офісне обладнання та комп’ютерна техніка',
    expectedCostThousands: '1 240',
    procedureType: 'Відкриті торги',
    initiatorDepartment: 'Відділ закупівель',
    responsiblePersons: 'ТЗ: Іванов А.П.; тех. експерт: Петренко С.В.; кошторисник: Коваль О.М.; закупник: І. Петренко',
    actualApplicationDeadline: '2025-03-10',
    procedureNumberEtm: 'UA-2025-03-001234 · https://etm.example/proc/001234',
    acceptedCounterparty: 'ТОВ «ТехноСервіс»',
    contractSubject: 'Поставка офісного та IT-обладнання',
    contractAmount: '1 180 000',
    signingDateAndType: '2025-04-22 · основний ДД',
    validityPeriod: '2025-05-01 — 2025-12-31',
    notesAndAmendments: 'Без змін. Додаток №1 — специфікація обладнання.',
  },
  '2': {
    orderNumber: '2',
    rpzYearItem: '2025 · пункт 021',
    procurementSubject: 'Послуги з аудиту фінансової звітності',
    expectedCostThousands: '380',
    procedureType: 'Переговорна процедура',
    initiatorDepartment: 'Фінансовий відділ',
    responsiblePersons: 'ТЗ: Мельник В.І.; закупник: О. Коваленко',
    actualApplicationDeadline: '2025-06-28',
    procedureNumberEtm: 'UA-2025-06-005678',
    acceptedCounterparty: 'ТОВ «Аудит-Партнер»',
    contractSubject: 'Аудит річної фінансової звітності',
    contractAmount: '365 000',
    signingDateAndType: '2025-07-15 · основний ДД',
    validityPeriod: '2025-08-01 — 2025-10-31',
    notesAndAmendments: '—',
  },
};

export function getDdFormById(id: string): DdFormData | null {
  const row = mockDdListItems.find((item) => item.id === id);
  if (!row) {
    return null;
  }

  const empty = createEmptyDdForm();
  const extra = detailById[id] ?? {};

  return {
    ...empty,
    ...extra,
    year: row.year,
    number: row.number,
    procurementSubject: extra.procurementSubject ?? row.subject,
    rpzYearItem: extra.rpzYearItem ?? `${row.year} · пункт ${row.item}`,
    procedureType: extra.procedureType ?? row.procedure,
    acceptedCounterparty: extra.acceptedCounterparty ?? row.counterparty,
    contractAmount: extra.contractAmount ?? row.amount,
    signingDateAndType: extra.signingDateAndType ?? `${row.date} · основний ДД`,
  };
}
