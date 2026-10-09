import { mockRpzListItems } from './rpzList';
import { createEmptyRpzForm, type RpzFormData } from '../types/rpzForm';

const detailById: Record<string, Partial<RpzFormData>> = {
  '1': {
    initiatorDepartment: 'Відділ закупівель',
    headFullName: 'Петренко Іван Олександрович',
    executorFullName: 'Коваль Наталія Сергіївна',
    subject: 'Офісне обладнання та комп’ютерна техніка',
    needType: 'Разова',
    procurementType: 'Товари',
    category: 'IT-обладнання',
    fundingSource: 'Операційний бюджет',
    ipInkrekpItem: '4.2.1',
    eventName: 'Модернізація робочих місць',
    expectedCost: '1 240 000 грн',
    completionDate: '2025-12-31',
    counterparty: 'ТОВ «ТехноСервіс»',
    plannedTzSubmitDate: '2025-03-15',
    plannedContractDate: '2025-04-20',
    plannedWorkStartDate: '2025-05-01',
    responsibleBuyer: 'І. Петренко',
    status: 'Затверджено',
  },
  '2': {
    initiatorDepartment: 'Фінансовий відділ',
    headFullName: 'Коваленко Оlena Миколаївна',
    executorFullName: 'Шевченко Андрій Петрович',
    subject: 'Послуги з аудиту фінансової звітності',
    needType: 'Щорічна',
    procurementType: 'Послуги',
    category: 'Фінансові послуги',
    fundingSource: 'Спеціальний фонд',
    ipInkrekpItem: '2.1.3',
    eventName: 'Річний аудит',
    expectedCost: '380 000 грн',
    completionDate: '2025-09-30',
    counterparty: 'ТОВ «Аудит-Партнер»',
    plannedTzSubmitDate: '2025-06-01',
    plannedContractDate: '2025-07-10',
    plannedWorkStartDate: '2025-08-01',
    responsibleBuyer: 'О. Коваленко',
    status: 'На погодженні',
  },
};

export function getRpzFormById(id: string): RpzFormData | null {
  const listRow = mockRpzListItems.find((item) => item.id === id);
  if (!listRow) {
    return null;
  }

  const empty = createEmptyRpzForm();
  const extra = detailById[id] ?? {};

  return {
    ...empty,
    ...extra,
    year: listRow.year,
    number: listRow.number,
    subject: extra.subject ?? listRow.subject,
    expectedCost: extra.expectedCost ?? listRow.expectedCost,
    needType: extra.needType ?? listRow.need,
    responsibleBuyer: extra.responsibleBuyer ?? listRow.buyer,
    status: extra.status ?? listRow.status,
    initiatorDepartment: extra.initiatorDepartment ?? listRow.department,
  };
}
