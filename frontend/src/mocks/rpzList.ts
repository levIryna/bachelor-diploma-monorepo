export type RpzListItem = {
  id: string;
  year: string;
  number: string;
  department: string;
  subject: string;
  expectedCost: string;
  need: string;
  status: string;
  buyer: string;
};

/** Мок даних таблиці РПЗ (сторінка 3 — список). */
export const mockRpzListItems: RpzListItem[] = [
  {
    id: '1',
    year: '2025',
    number: 'РПЗ-2025-014',
    department: 'Відділ закупівель',
    subject: 'Офісне обладнання та комп’ютерна техніка',
    expectedCost: '1 240 000 грн',
    need: 'Q2 2025',
    status: 'Затверджено',
    buyer: 'І. Петренко',
  },
  {
    id: '2',
    year: '2025',
    number: 'РПЗ-2025-021',
    department: 'Фінансовий відділ',
    subject: 'Послуги з аудиту фінансової звітності',
    expectedCost: '380 000 грн',
    need: 'Q3 2025',
    status: 'На погодженні',
    buyer: 'О. Коваленко',
  },
  {
    id: '3',
    year: '2024',
    number: 'РПЗ-2024-088',
    department: 'Юридичний відділ',
    subject: 'Юридичний супровід договорів закупівель',
    expectedCost: '210 000 грн',
    need: 'Q4 2024',
    status: 'Виконано',
    buyer: 'М. Сидоренко',
  },
  {
    id: '4',
    year: '2025',
    number: 'РПЗ-2025-003',
    department: 'Відділ закупівель',
    subject: 'Паливно-мастильні матеріали',
    expectedCost: '560 000 грн',
    need: 'Q1 2025',
    status: 'Чернетка',
    buyer: 'І. Петренко',
  },
];

export const RPZ_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Усі статуси' },
  { value: 'draft', label: 'Чернетка' },
  { value: 'pending', label: 'На погодженні' },
  { value: 'approved', label: 'Затверджено' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'done', label: 'Виконано' },
] as const;
