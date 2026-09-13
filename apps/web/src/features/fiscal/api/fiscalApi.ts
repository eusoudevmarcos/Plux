import { apiFetch } from "@/lib/api";

export type FiscalDocumentType = "NFE" | "NFCE" | "NFE_DEVOLUCAO";
export type FiscalDocumentStatus =
  | "DRAFT"
  | "VALIDATED"
  | "TRANSMISSION_BLOCKED"
  | "QUEUED"
  | "AUTHORIZED"
  | "REJECTED"
  | "CANCELLED";
export type FiscalEnvironment = "HOMOLOGATION" | "PRODUCTION";

export type FiscalDocument = {
  id: string;
  storeId: string;
  saleId?: string | null;
  purchaseId?: string | null;
  type: FiscalDocumentType;
  environment: FiscalEnvironment;
  status: FiscalDocumentStatus;
  series: string;
  number: number;
  accessKey?: string | null;
  protocol?: string | null;
  rejectionReason?: string | null;
  issuedAt?: string | null;
  authorizedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sale?: { id: string; number: number; total: string | number } | null;
  purchase?: { id: string; number: number; total: string | number } | null;
  events: Array<{
    id: string;
    type: string;
    status: FiscalDocumentStatus;
    reason?: string | null;
    createdAt: string;
  }>;
};

type PreparePayload = {
  storeId: string;
  environment?: FiscalEnvironment;
  series?: string;
};

export function getFiscalDocuments(storeId: string) {
  return apiFetch<FiscalDocument[]>(`/fiscal/documents?storeId=${encodeURIComponent(storeId)}`);
}

export function prepareNfceFromSale(saleId: string, payload: PreparePayload) {
  return apiFetch<FiscalDocument>(`/fiscal/documents/nfce/sales/${saleId}/prepare`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function prepareNfeFromSale(saleId: string, payload: PreparePayload) {
  return apiFetch<FiscalDocument>(`/fiscal/documents/nfe/sales/${saleId}/prepare`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function preparePurchaseReturnNfe(
  purchaseId: string,
  payload: PreparePayload & { reason?: string },
) {
  return apiFetch<FiscalDocument>(`/fiscal/documents/nfe/purchases/${purchaseId}/return/prepare`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function transmitFiscalDocument(id: string) {
  return apiFetch<FiscalDocument>(`/fiscal/documents/${id}/transmit`, {
    method: "POST",
  });
}

export function cancelFiscalDocument(id: string, reason: string) {
  return apiFetch<FiscalDocument>(`/fiscal/documents/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
