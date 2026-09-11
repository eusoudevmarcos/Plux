import { apiFetch } from "@/lib/api";

export type PaymentMethod = "PIX" | "DINHEIRO" | "DEBITO" | "CREDITO" | "OUTRO";

export type SaleCheckoutPayload = {
  storeId: string;
  customerName?: string | null;
  discount?: number;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  payments: Array<{
    method: PaymentMethod;
    amount: number;
  }>;
};

export function checkoutSale(payload: SaleCheckoutPayload) {
  return apiFetch<{ id: string; number: number; total: string | number }>("/sales/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
