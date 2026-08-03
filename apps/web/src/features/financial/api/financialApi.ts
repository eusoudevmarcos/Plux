import { apiFetch } from "@/lib/api";
import type { ProductFinancialReport } from "../types";

export function getProductFinancialReport() {
  return apiFetch<ProductFinancialReport>("/financial/product-report");
}
