import { apiFetch } from "@/lib/api";

export type ReadinessLevel = "OK" | "ATTENTION" | "BLOCKED";

export type BetaReadiness = {
  generatedAt: string;
  status: ReadinessLevel;
  store: {
    id: string;
    tradeName: string;
    taxRegime: string;
    state: string;
  } | null;
  checks: Array<{
    level: ReadinessLevel;
    title: string;
    detail: string;
  }>;
};

export function getBetaReadiness(storeId?: string) {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  return apiFetch<BetaReadiness>(`/system/beta-readiness${query}`);
}
