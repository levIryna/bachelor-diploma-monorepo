export const KPI_CARDS_TITLE = {
  planed_sum: 'Заплановано закупівль',
  planed_amount: 'Кількість заплан. закупівель',
  signed_contracts: 'Кількість укладених договорів',
  contacts_total_sum: 'Загальна сума договорів',
  total_savings: 'Загальна сума економії',
  average_savings: 'Середній % економії',
  purchases_in_progress: 'Закупівлі у роботі',
  in_risk: 'Ризик невиконання в срок',
};

export const PROCUREMENT_STATUS_LABEL = {
  planned: 'Заплановано',
  in_preparation: 'У підготовці',
  contract_signed: 'Договір укладено',
  completed: 'Завершено',
} as const;

export const UKR_CURRECY = 'грн';

export const KPI_CARDS_METRIC = {
  planed_sum: UKR_CURRECY,
  planed_amount: '',
  signed_contracts: '',
  contacts_total_sum: UKR_CURRECY,
  total_savings: UKR_CURRECY,
  average_savings: '%',
  purchases_in_progress: '',
  in_risk: '',
} as const;
