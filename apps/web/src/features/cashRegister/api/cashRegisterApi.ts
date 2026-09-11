import { apiFetch } from "@/lib/api";

export type CashMovementType = "ABERTURA" | "VENDA" | "SANGRIA" | "SUPRIMENTO" | "FECHAMENTO";

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: string | number;
  description?: string | null;
  createdAt: string;
};

export type CashRegisterSale = {
  id: string;
  number: number;
  total: string | number;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  closedAt?: string | null;
  createdAt: string;
};

export type CashRegister = {
  id: string;
  storeId?: string | null;
  status: "OPEN" | "CLOSED";
  openingBalance: string | number;
  closingBalanceInformed?: string | number | null;
  closingBalanceExpected?: string | number | null;
  difference?: string | number | null;
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
  movements: CashMovement[];
  sales: CashRegisterSale[];
};

export function getCurrentCashRegister(storeId: string) {
  return apiFetch<CashRegister | null>(`/cash-register/current?storeId=${encodeURIComponent(storeId)}`);
}

export function openCashRegister(payload: { storeId: string; openingBalance: number; notes?: string | null }) {
  return apiFetch<CashRegister>("/cash-register/open", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCashMovement(
  cashRegisterId: string,
  payload: { type: "SANGRIA" | "SUPRIMENTO"; amount: number; description?: string | null },
) {
  return apiFetch<CashMovement>(`/cash-register/${cashRegisterId}/movements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function closeCashRegister(
  cashRegisterId: string,
  payload: { closingBalanceInformed: number; notes?: string | null },
) {
  return apiFetch<CashRegister>(`/cash-register/${cashRegisterId}/close`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
