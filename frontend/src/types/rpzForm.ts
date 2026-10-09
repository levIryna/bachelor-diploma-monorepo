export type RpzFormData = {
  year: string;
  number: string;
  initiatorDepartment: string;
  headFullName: string;
  executorFullName: string;
  subject: string;
  needType: string;
  procurementType: string;
  category: string;
  fundingSource: string;
  ipInkrekpItem: string;
  eventName: string;
  expectedCost: string;
  completionDate: string;
  counterparty: string;
  plannedTzSubmitDate: string;
  plannedContractDate: string;
  plannedWorkStartDate: string;
  responsibleBuyer: string;
  status: string;
};

export type RpzFormMode = 'view' | 'edit' | 'create';

export function createEmptyRpzForm(): RpzFormData {
  return {
    year: '',
    number: '',
    initiatorDepartment: '',
    headFullName: '',
    executorFullName: '',
    subject: '',
    needType: '',
    procurementType: '',
    category: '',
    fundingSource: '',
    ipInkrekpItem: '',
    eventName: '',
    expectedCost: '',
    completionDate: '',
    counterparty: '',
    plannedTzSubmitDate: '',
    plannedContractDate: '',
    plannedWorkStartDate: '',
    responsibleBuyer: '',
    status: '',
  };
}
