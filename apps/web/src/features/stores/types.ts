import type { TaxRegime } from "@/features/company/types";

export type Store = {
  id: string;
  ownerId: string;
  legalName: string;
  tradeName: string;
  document?: string | null;
  taxRegime: TaxRegime;
  state: string;
  city: string;
  district: string;
  addressLine: string;
  addressNumber: string;
  addressComplement?: string | null;
  zipCode?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreInput = {
  legalName: string;
  tradeName: string;
  document?: string | null;
  taxRegime: TaxRegime;
  state: string;
  city: string;
  district: string;
  addressLine: string;
  addressNumber: string;
  addressComplement?: string | null;
  zipCode?: string | null;
  active?: boolean;
};
