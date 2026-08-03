import { apiFetch } from "@/lib/api";
import { getActiveStoreId } from "@/features/stores/activeStore";
import type { ProductFinancialReport } from "../types";

export function getProductFinancialReport() {
  const storeId = getActiveStoreId();
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";

  return apiFetch<ProductFinancialReport>(`/financial/product-report${query}`);
}
