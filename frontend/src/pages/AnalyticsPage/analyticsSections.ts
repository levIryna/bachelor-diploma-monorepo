export type AnalyticsSectionConfig = {
  id: string;
  label: string;
  description: string;
};

export const ANALYTICS_SECTIONS: AnalyticsSectionConfig[] = [
  {
    id: 'cost-analysis',
    label: 'Аналіз вартості',
    description: 'Порівняння запланованої та фактичної вартості закупівель.',
  },
  {
    id: 'savings-analysis',
    label: 'Аналіз економії',
    description: 'Економія коштів за період та структура за підрозділами.',
  },
  {
    id: 'dynamics',
    label: 'Динаміка',
    description: 'Зміни показників закупівель у часі.',
  },
  {
    id: 'categories',
    label: 'Категорії',
    description: 'Розподіл закупівель за категоріями товарів і послуг.',
  },
  {
    id: 'rating',
    label: 'Рейтинг',
    description: 'Рейтинг підрозділів та закупників за ключовими KPI.',
  },
  {
    id: 'procurement-methods',
    label: 'Способи закупівлі',
    description: 'Частка процедур за видами та способами закупівель.',
  },
];
