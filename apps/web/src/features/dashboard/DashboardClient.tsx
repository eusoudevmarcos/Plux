"use client";

import { AlertTriangle, Banknote, Boxes, CircleDollarSign, ClipboardCheck, PackageOpen, ReceiptText, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getActiveStore } from "@/features/stores/activeStore";
import type { Store } from "@/features/stores/types";
import { formatMoney, formatPercent } from "@/lib/utils/money";
import { getDashboardSummary, type DashboardSummary } from "./api/dashboardApi";
import styles from "./Dashboard.module.css";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function movementLabel(type: string, origin: string) {
  return `${type} / ${origin}`;
}

export function DashboardClient() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(storeId: string) {
    setError(null);
    const data = await getDashboardSummary(storeId);
    setDashboard(data);
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

  const summary = dashboard?.summary;

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Operação real da loja</p>
          <h2>Dashboard</h2>
        </div>
        <Button type="button" variant="secondary" disabled={!store || loading} onClick={() => store && loadData(store.id)}>
          <RotateCw size={16} aria-hidden />
          Atualizar
        </Button>
      </div>

      {store ? (
        <Card className={styles.storeBand}>
          <div>
            <span>Loja</span>
            <strong>{store.tradeName}</strong>
          </div>
          <div>
            <span>Regime</span>
            <strong>{store.taxRegime}</strong>
          </div>
          <div>
            <span>Caixa</span>
            <strong>{dashboard?.cashRegister ? "Aberto" : "Fechado"}</strong>
          </div>
          <div>
            <span>Período</span>
            <strong>{dashboard?.period.label ?? "Últimos 30 dias"}</strong>
          </div>
        </Card>
      ) : null}

      {error ? <div className={styles.alert}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Carregando indicadores da operação...</div> : null}

      {summary ? (
        <>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <CircleDollarSign size={20} aria-hidden />
              <span>Vendas</span>
              <strong>{formatMoney(summary.salesTotal)}</strong>
              <small>{summary.salesCount} venda(s)</small>
            </Card>
            <Card className={styles.statCard}>
              <Banknote size={20} aria-hidden />
              <span>Lucro bruto</span>
              <strong>{formatMoney(summary.salesGrossProfit)}</strong>
              <small>CMV vendido {formatMoney(summary.salesCost)}</small>
            </Card>
            <Card className={styles.statCard}>
              <ReceiptText size={20} aria-hidden />
              <span>Compras</span>
              <strong>{formatMoney(summary.purchasesTotal)}</strong>
              <small>{summary.purchasesCount} entrada(s)</small>
            </Card>
            <Card className={styles.statCard}>
              <ClipboardCheck size={20} aria-hidden />
              <span>A pagar</span>
              <strong>{formatMoney(summary.openPayablesTotal)}</strong>
              <small>{summary.overduePayablesCount} vencida(s)</small>
            </Card>
            <Card className={styles.statCard}>
              <Boxes size={20} aria-hidden />
              <span>Estoque custo</span>
              <strong>{formatMoney(summary.stockValue)}</strong>
              <small>{summary.ingredientsCount} ingrediente(s)</small>
            </Card>
            <Card className={styles.statCard}>
              <PackageOpen size={20} aria-hidden />
              <span>Produtos</span>
              <strong>{summary.productsCount}</strong>
              <small>CMV médio {formatPercent(summary.averageCmvPercent)}%</small>
            </Card>
            <Card className={styles.statCard}>
              <AlertTriangle size={20} aria-hidden />
              <span>Estoque crítico</span>
              <strong>{summary.criticalStockCount}</strong>
              <small>Itens abaixo do limite</small>
            </Card>
            <Card className={styles.statCard}>
              <ReceiptText size={20} aria-hidden />
              <span>Fiscal</span>
              <strong>{summary.fiscalDocumentsCount}</strong>
              <small>{summary.taxReviewCount} revisão(ões)</small>
            </Card>
          </div>

          <div className={styles.reportGrid}>
            <Card className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3>Estoque crítico</h3>
                <span>{dashboard.criticalStock.length} itens</span>
              </div>
              {dashboard.criticalStock.length === 0 ? (
                <div className={styles.empty}>Nenhum ingrediente abaixo do limite operacional.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th>Estoque</th>
                        <th>Limite</th>
                        <th>Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.criticalStock.map((ingredient) => (
                        <tr key={ingredient.id}>
                          <td>
                            <strong>{ingredient.name}</strong>
                            <span>{ingredient.severity} · NCM {ingredient.ncm}</span>
                          </td>
                          <td>{ingredient.stockCurrent.toLocaleString("pt-BR")} {ingredient.unitMeasure}</td>
                          <td>{ingredient.criticalLimit.toLocaleString("pt-BR")} {ingredient.unitMeasure}</td>
                          <td>{formatMoney(ingredient.stockValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3>Movimentações recentes</h3>
                <span>{dashboard.recentStockMovements.length} registros</span>
              </div>
              {dashboard.recentStockMovements.length === 0 ? (
                <div className={styles.empty}>Nenhuma movimentação lançada para a loja.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Movimento</th>
                        <th>Quantidade</th>
                        <th>Quando</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentStockMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>
                            <strong>{movement.ingredientName}</strong>
                            <span>{movement.notes ?? "Sem observação"}</span>
                          </td>
                          <td>{movementLabel(movement.type, movement.origin)}</td>
                          <td>{movement.quantity.toLocaleString("pt-BR")} {movement.unitMeasure}</td>
                          <td>{formatDateTime(movement.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
