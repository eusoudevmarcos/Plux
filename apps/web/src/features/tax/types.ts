export type TaxClassification = {
  id: string;
  sourceVersion: string;
  cstIbsCbs: string;
  cstDescription: string;
  cClassTrib: string;
  cClassName: string;
  cClassDescription?: string | null;
  rateType?: string | null;
  pRedIbs: string | number;
  pRedCbs: string | number;
  appliesNfe: boolean;
  appliesNfce: boolean;
  appliesNfse: boolean;
  legalReference?: string | null;
};

