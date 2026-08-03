export type TaxRegime = "SIMPLES" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";

export type CompanyProfile = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  taxRegime: TaxRegime;
  uf: string;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyProfileInput = {
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  taxRegime: TaxRegime;
  uf: string;
  city?: string | null;
};

export const taxRegimeLabels: Record<TaxRegime, string> = {
  SIMPLES: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro presumido",
  LUCRO_REAL: "Lucro real",
};
