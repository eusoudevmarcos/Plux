import { apiFetch } from "@/lib/api";
import type { AuraCustomer, AuraPayment, AuraPlan, AuraSummary } from "../types";

export function getAuraSummary() {
  return apiFetch<AuraSummary>("/aura/summary");
}

export function getAuraPlans() {
  return apiFetch<AuraPlan[]>("/aura/plans");
}

export function createAuraPlan(values: {
  name: string;
  description?: string;
  monthlyPrice: number;
  setupFee: number;
  maxStores: number;
  features?: string;
  active: boolean;
}) {
  return apiFetch<AuraPlan>("/aura/plans", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function getAuraCustomers() {
  return apiFetch<AuraCustomer[]>("/aura/customers");
}

export function createAuraCustomer(values: {
  name: string;
  email: string;
  password: string;
  legalName: string;
  tradeName?: string;
  document?: string;
  phone?: string;
  taxRegime: string;
  notes?: string;
}) {
  return apiFetch<unknown>("/aura/customers", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function createAuraContract(customerId: string, values: {
  planId: string;
  code: string;
  status: string;
  startsAt: string;
  paymentCurrentUntil: string;
  contractUrl?: string;
  notes?: string;
}) {
  return apiFetch<unknown>(`/aura/customers/${customerId}/contracts`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function createAuraPayment(customerId: string, values: {
  contractId?: string;
  amount: number;
  dueDate: string;
  paidThrough?: string;
  status: string;
  method: string;
  reference?: string;
  notes?: string;
}) {
  return apiFetch<AuraPayment>(`/aura/customers/${customerId}/payments`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateAuraAccess(customerId: string, values: {
  status: string;
  accessEnabled: boolean;
  paymentCurrentUntil?: string | null;
  notes?: string;
}) {
  return apiFetch<AuraCustomer>(`/aura/customers/${customerId}/access`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}
