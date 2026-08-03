import type { TaxRegime } from "@/features/company/types";

export type AuraPlan = {
  id: string;
  name: string;
  description?: string | null;
  monthlyPrice: string | number;
  setupFee: string | number;
  maxStores: number;
  features?: string | null;
  active: boolean;
};

export type AuraPayment = {
  id: string;
  amount: string | number;
  dueDate: string;
  paidAt?: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELED";
  method: "PIX" | "CREDIT_CARD" | "BOLETO" | "BANK_TRANSFER" | "CASH" | "OTHER";
  reference?: string | null;
};

export type AuraContract = {
  id: string;
  planId: string;
  code: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "CANCELED" | "EXPIRED";
  startsAt: string;
  endsAt?: string | null;
  signedAt?: string | null;
  monthlyPriceSnapshot: string | number;
  setupFeeSnapshot: string | number;
  contractUrl?: string | null;
  plan: AuraPlan;
};

export type AuraCustomer = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  phone?: string | null;
  taxRegime: TaxRegime;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELED";
  accessEnabled: boolean;
  paymentCurrentUntil?: string | null;
  notes?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  contracts: AuraContract[];
  payments: AuraPayment[];
};

export type AuraSummary = {
  customersCount: number;
  activeCustomersCount: number;
  pendingCustomersCount: number;
  suspendedCustomersCount: number;
  overduePaymentsCount: number;
  paidRevenue: number;
};
