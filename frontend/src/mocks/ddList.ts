export type DdListItem = {
  id: string;
  number: string;
  year: string;
  item: string;
  subject: string;
  procedure: string;
  counterparty: string;
  amount: string;
  date: string;
};

export const mockDdListItems: DdListItem[] = [
  {
    id: '1',
    number: 'ДД-2025-012',
    year: '2025',
    item: '014',
    subject: 'Офісне обладнання та комп’ютерна техніка',
    procedure: 'Відкриті торги',
    counterparty: 'ТОВ «ТехноСервіс»',
    amount: '1 180 000',
    date: '2025-04-22',
  },
  {
    id: '2',
    number: 'ДД-2025-008',
    year: '2025',
    item: '021',
    subject: 'Послуги з аудиту фінансової звітності',
    procedure: 'Переговорна процедура',
    counterparty: 'ТОВ «Аудит-Партнер»',
    amount: '365 000',
    date: '2025-07-15',
  },
  {
    id: '3',
    number: 'ДД-2024-045',
    year: '2024',
    item: '088',
    subject: 'Юридичний супровід договорів закупівель',
    procedure: 'Запит цінових пропозицій',
    counterparty: 'ТОВ «ПравоКонсалт»',
    amount: '198 500',
    date: '2024-11-03',
  },
];
