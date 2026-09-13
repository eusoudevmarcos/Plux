"use client";

import { Ban, FilePlus2, RefreshCw, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getPurchases } from "@/features/purchases/api/purchasesApi";
import type { Purchase } from "@/features/purchases/types";
import { getSales, type Sale } from "@/features/sales/api/salesApi";
import { getActiveStore } from "@/features/stores/activeStore";
import type { Store } from "@/features/stores/types";
import { formatMoney } from "@/lib/utils/money";
import {
  cancelFiscalDocument,
  getFiscalDocuments,
  prepareNfceFromSale,
  prepareNfeFromSale,
  preparePurchaseReturnNfe,
  transmitFiscalDocument,
  type FiscalDocument,
  type FiscalDocumentStatus,
  type FiscalDocumentType,
} from "../api/fiscalApi";
import styles from "./FiscalOperationsPage.module.css";

const documentLabels: Record<FiscalDocumentType, string> = {
  NFCE: "NFC-e",
  NFE: "NF-e",
  NFE_DEVOLUCAO: "NF-e devolução",
};

const statusLabels: Record<FiscalDocumentStatus, string> = {
  DRAFT: "Rascunho",
  VALIDATED: "Preparado",
  TRANSMISSION_BLOCKED: "Transmissão bloqueada",
  QUEUED: "Em fila",
  AUTHORIZED: "Autorizado",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
};

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function FiscalOperationsPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData(storeId: string) {
    const [documentList, saleList, purchaseList] = await Promise.all([
      getFiscalDocuments(storeId),
      getSales(storeId),
      getPurchases(storeId),
    ]);

    setDocuments(documentList);
    setSales(saleList.filter((sale) => sale.status === "COMPLETED"));
    setPurchases(purchaseList.filter((purchase) => purchase.status === "POSTED"));
  }

  useEffect(() => {
    const activeStore = getActiveStore();

    if (!activeStore) {
      router.replace("/lojas");
      return;
    }

    setStore(activeStore);
    loadData(activeStore.id)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  async function runAction(key: string, message: string, action: () => Promise<FiscalDocument>) {
    if (!store) return;

    setBusyKey(key);
    setError(null);
    setSuccess(null);
    try {
      const document = await action();
      await loadData(store.id);
      setSuccess(`${message}: ${documentLabels[document.type]} serie ${document.series} numero ${document.number}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar ação fiscal.");
    } finally {
      setBusyKey(null);
    }
  }

  function handleCancel(document: FiscalDocument) {
    const reason = window.prompt(
      "Motivo do cancelamento",
      "Cancelamento operacional antes da homologacao oficial SEFAZ.",
    );

    if (!reason) return;

    runAction(`cancel-${document.id}`, "Cancelamento registrado", () => cancelFiscalDocument(document.id, reason));
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Emissão fiscal preparada</p>
          <h2>Documentos fiscais</h2>
        </div>
        <div className={styles.headerActions}>
          <Link href="/fiscal/catalogo">Catálogo CST</Link>
          <Button type="button" variant="secondary" disabled={!store || loading} onClick={() => store && loadData(store.id)}>
            <RefreshCw size={16} aria-hidden />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className={styles.noticeCard}>
        <strong>Pronto para fluxo interno e auditoria.</strong>
        <span>
          A transmissão oficial fica bloqueada até certificado A1, assinatura XML, XSD, QR Code/DANFE e homologação por UF.
        </span>
      </Card>

      {error ? <div className={styles.alert}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}
      {loading ? <div className={styles.empty}>Carregando documentos fiscais...</div> : null}

      <div className={styles.actionGrid}>
        <Card className={styles.panel}>
          <div className={styles.cardHeader}>
            <h3>Vendas prontas</h3>
            <span>{sales.length} venda(s)</span>
          </div>
          {sales.length === 0 ? (
            <div className={styles.empty}>Finalize uma venda no caixa para preparar NFC-e/NF-e.</div>
          ) : (
            <div className={styles.list}>
              {sales.slice(0, 8).map((sale) => (
                <div className={styles.listItem} key={sale.id}>
                  <div>
                    <strong>Venda #{sale.number}</strong>
                    <span>{formatDate(sale.closedAt)} · {formatMoney(numberValue(sale.total))}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!store || busyKey === `nfce-${sale.id}`}
                      onClick={() =>
                        store &&
                        runAction(`nfce-${sale.id}`, "NFC-e preparada", () =>
                          prepareNfceFromSale(sale.id, { storeId: store.id, environment: "HOMOLOGATION" }),
                        )
                      }
                    >
                      <FilePlus2 size={15} aria-hidden />
                      NFC-e
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!store || busyKey === `nfe-${sale.id}`}
                      onClick={() =>
                        store &&
                        runAction(`nfe-${sale.id}`, "NF-e preparada", () =>
                          prepareNfeFromSale(sale.id, { storeId: store.id, environment: "HOMOLOGATION" }),
                        )
                      }
                    >
                      NF-e
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className={styles.panel}>
          <div className={styles.cardHeader}>
            <h3>Devoluções de compra</h3>
            <span>{purchases.length} compra(s)</span>
          </div>
          {purchases.length === 0 ? (
            <div className={styles.empty}>Lance uma compra para preparar NF-e de devolução.</div>
          ) : (
            <div className={styles.list}>
              {purchases.slice(0, 8).map((purchase) => (
                <div className={styles.listItem} key={purchase.id}>
                  <div>
                    <strong>Compra #{purchase.number}</strong>
                    <span>{purchase.supplier?.name ?? "Sem fornecedor"} · {formatMoney(numberValue(purchase.total))}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!store || busyKey === `return-${purchase.id}`}
                    onClick={() =>
                      store &&
                      runAction(`return-${purchase.id}`, "NF-e de devolução preparada", () =>
                        preparePurchaseReturnNfe(purchase.id, {
                          storeId: store.id,
                          environment: "HOMOLOGATION",
                          reason: "Devolucao de compra preparada para conferencia fiscal.",
                        }),
                      )
                    }
                  >
                    <Undo2 size={15} aria-hidden />
                    Devolução
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <h3>Documentos preparados</h3>
          <span>{documents.length} registro(s)</span>
        </div>
        {documents.length === 0 ? (
          <div className={styles.empty}>Nenhum documento fiscal preparado ainda.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th>Criado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <strong>{documentLabels[document.type]} #{document.number}</strong>
                      <span>Série {document.series} · {document.environment}</span>
                    </td>
                    <td>
                      {document.sale ? `Venda #${document.sale.number}` : null}
                      {document.purchase ? `Compra #${document.purchase.number}` : null}
                      {!document.sale && !document.purchase ? "--" : null}
                    </td>
                    <td>
                      <span className={styles.statusPill} data-status={document.status}>
                        {statusLabels[document.status]}
                      </span>
                      {document.rejectionReason ? <small>{document.rejectionReason}</small> : null}
                    </td>
                    <td>{formatDate(document.createdAt)}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busyKey === `send-${document.id}` || document.status === "CANCELLED"}
                          onClick={() => runAction(`send-${document.id}`, "Transmissão registrada", () => transmitFiscalDocument(document.id))}
                        >
                          <Send size={15} aria-hidden />
                          Transmitir
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busyKey === `cancel-${document.id}` || document.status === "CANCELLED"}
                          onClick={() => handleCancel(document)}
                        >
                          <Ban size={15} aria-hidden />
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
