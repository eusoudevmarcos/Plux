export type TaxAssistantSuggestion = {
  scope: "INGREDIENT" | "PRODUCT";
  matchedRuleId: string;
  matchedRule: string;
  reason: string;
  ncm: string;
  pisCst: string;
  cofinsCst: string;
  icmsCst?: string | null;
  icmsCsosn?: string | null;
  cstIbsCbs: string;
  cClassTrib: string;
  taxClassificationId?: string | null;
  taxConfidence: "APPROVED" | "REVIEW_REQUIRED";
  taxNotes: string;
  alternativeRules: Array<{
    id: string;
    label: string;
    cClassTrib: string;
    cstIbsCbs: string;
    score: number;
  }>;
};
