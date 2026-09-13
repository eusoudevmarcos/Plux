import { apiFetch } from "@/lib/api";

export type CriticalStockItem = {
  id: string;
  name: string;
  unitMeasure: string;
  stockCurrent: number;
  unitCost: number;
  stockValue: number;
  criticalLimit: number;
  severity: "LOW" | "CRITICAL" | "BLOCKED";
  ncm: string;
};

export type DashboardSummary = {
  store: {
    id: string;
    tradeName: string;
    taxRegime: string;
    state: string;
  };
  period: {
    label: string;
    since: string;
  };
  summary: {
    salesTotal: number;
    salesCost: number;
    salesGrossProfit: number;
    salesCount: number;
    purchasesTotal: number;
    purchasesCount: number;
    openPayablesTotal: number;
    openPayablesCount: number;
    overduePayablesCount: number;
    stockValue: number;
    ingredientsCount: number;
    productsCount: number;
    averageCmvPercent: number;
    taxReviewCount: number;
    criticalStockCount: number;
    fiscalDocumentsCount: number;
  };
  cashRegister: {
    id: string;
    status: "OPEN" | "CLOSED";
    openedAt: string;
    openingBalance: number;
  } | null;
  criticalStock: CriticalStockItem[];
  recentStockMovements: Array<{
    id: string;
    ingredientName: string;
    type: string;
    origin: string;
    quantity: number;
    unitMeasure: string;
    totalCost?: number | null;
    createdAt: string;
    notes?: string | null;
  }>;
};

export function getDashboardSummary(storeId: string) {
  return apiFetch<DashboardSummary>(`/dashboard/summary?storeId=${encodeURIComponent(storeId)}`);
}
