import type { TaxClassification } from "../tax/types";

export type UnitMeasure = "g" | "ml" | "un";
export type TaxConfidence = "APPROVED" | "REVIEW_REQUIRED" | "BLOCKED";

export type Ingredient = {
  id: string;
  name: string;
  unitMeasure: UnitMeasure;
  unitCost: string | number;
  stockCurrent: string | number;
  ncm: string;
  pisCst: string;
  cofinsCst: string;
  icmsCst?: string | null;
  icmsCsosn?: string | null;
  taxBenefitCode?: string | null;
  taxConfidence: TaxConfidence;
  taxNotes?: string | null;
  taxClassificationId?: string | null;
  taxClassification?: TaxClassification | null;
};

