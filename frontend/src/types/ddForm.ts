export type DdFormMode = 'view' | 'edit' | 'create';

export type DdFormData = {
  year: string;
  number: string;
  rpzYearItem: string;
  subject: string;
  itemType: string;
  expectedCostThousands: string;
  procedure: string;
  initiatorDepartment: string;
  tzResponsibleName: string;
  technicalExpertName: string;
  estimatorName: string;
  buyerName: string;
  actualApplicationDate: string;
  procedureNumber: string;
  etmUrl: string;
  contractor: string;
  contractSubject: string;
  contractAmount: string;
  contractDate: string;
  contractType: string;
  validFrom: string;
  validTo: string;
  notes: string;
  amendments: string;
};

export function createEmptyDdForm(): DdFormData {
  return {
    year: '',
    number: '',
    rpzYearItem: '',
    subject: '',
    itemType: '',
    expectedCostThousands: '',
    procedure: '',
    initiatorDepartment: '',
    tzResponsibleName: '',
    technicalExpertName: '',
    estimatorName: '',
    buyerName: '',
    actualApplicationDate: '',
    procedureNumber: '',
    etmUrl: '',
    contractor: '',
    contractSubject: '',
    contractAmount: '',
    contractDate: '',
    contractType: '',
    validFrom: '',
    validTo: '',
    notes: '',
    amendments: '',
  };
}
