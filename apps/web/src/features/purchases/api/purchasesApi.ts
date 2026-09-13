import { apiFetch } from "@/lib/api";
import type { AccountPayable, Purchase, PurchaseCreatePayload, Supplier, SupplierCreatePayload } from "../types";

export function getSuppliers(storeId: string) {
  return apiFetch<Supplier[]>(`/suppliers?storeId=${encodeURIComponent(storeId)}`);
}

export function createSupplier(payload: SupplierCreatePayload) {
  return apiFetch<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPurchases(storeId: string) {
  return apiFetch<Purchase[]>(`/purchases?storeId=${encodeURIComponent(storeId)}`);
}

export function createPurchase(payload: PurchaseCreatePayload) {
  return apiFetch<Purchase>("/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAccountPayables(storeId: string) {
  return apiFetch<AccountPayable[]>(`/purchases/payables?storeId=${encodeURIComponent(storeId)}`);
}

export function markAccountPayablePaid(id: string, payload: { paidAt?: string; notes?: string | null } = {}) {
  return apiFetch<AccountPayable>(`/purchases/payables/${id}/pay`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
