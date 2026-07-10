import { apiFetch } from "@/lib/api";
import type { TaxClassification } from "../types";

export function getTaxClassifications() {
  return apiFetch<TaxClassification[]>("/tax-classifications");
}

