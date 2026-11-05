export type AnalyticsSectionConfig = {
  id: string;
  label: string;
  description: string;
};

export const ANALYTICS_SECTIONS: AnalyticsSectionConfig[] = [
  {
    id: 'cost-analysis',
    label: 'Аналіз вартості',
    description:
      'Порівняння запланованої та фактичної вартості закупівель за обраним роком і підрозділом.',
  },
  {
    id: 'savings-analysis',
    label: 'Аналіз економії',
    description: 'Економія коштів за період та структура за підрозділами.',
  },
  {
    id: 'dynamics',
    label: 'Динаміка',
    description: 'Зміни запланованої вартості, фактичних витрат і економії за роками.',
  },
  {
    id: 'categories',
    label: 'Категорії',
    description: 'Розподіл запланованої суми закупівель за категоріями товарів і послуг.',
  },
  {
    id: 'procurement-methods',
    label: 'Способи закупівлі',
    description: 'Частка процедур за видами та способами закупівель.',
  },
];
