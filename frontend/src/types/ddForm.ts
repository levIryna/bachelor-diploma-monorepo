export type DdFormMode = 'view' | 'edit' | 'create';

export type DdFormData = {
  year: string;
  number: string;
  orderNumber: string;
  rpzYearItem: string;
  procurementSubject: string;
  expectedCostThousands: string;
  procedureType: string;
  initiatorDepartment: string;
  responsiblePersons: string;
  actualApplicationDeadline: string;
  procedureNumberEtm: string;
  acceptedCounterparty: string;
  contractSubject: string;
  contractAmount: string;
  signingDateAndType: string;
  validityPeriod: string;
  notesAndAmendments: string;
};

export function createEmptyDdForm(): DdFormData {
  return {
    year: '',
    number: '',
    orderNumber: '',
    rpzYearItem: '',
    procurementSubject: '',
    expectedCostThousands: '',
    procedureType: '',
    initiatorDepartment: '',
    responsiblePersons: '',
    actualApplicationDeadline: '',
    procedureNumberEtm: '',
    acceptedCounterparty: '',
    contractSubject: '',
    contractAmount: '',
    signingDateAndType: '',
    validityPeriod: '',
    notesAndAmendments: '',
  };
}
