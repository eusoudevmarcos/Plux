"use client";

import { BadgeDollarSign, Calculator, LineChart, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { taxRegimeLabels } from "@/features/company/types";
import { formatMoney, formatPercent } from "@/lib/utils/money";
import { getProductFinancialReport } from "../api/financialApi";
import type { ProductFinancialReport } from "../types";
import styles from "./FinancialReportsPage.module.css";

function markupLabel(markup: number | null) {
  return markup === null ? "---" : `${markup.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`;
}

export function FinancialReportsPage() {
  const [report, setReport] = useState<ProductFinancialReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductFinancialReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const weakestMargin = useMemo(() => {
    if (!report?.rows.length) {
      return null;
    }

    return [...report.rows].sort((a, b) => a.grossMarginPercent - b.grossMarginPercent)[0];
  }, [report]);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Financeiro operacional</p>
          <h2>Relatorios de custo e venda</h2>
        </div>
        <div className={styles.regimePill}>
          {report?.companyProfile ? taxRegimeLabels[report.companyProfile.taxRegime] : "Regime nao configurado"}
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Carregando relatorio financeiro...</div> : null}

      {report ? (
        <>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <BadgeDollarSign size={20} aria-hidden />
              <span>Venda catalogo</span>
              <strong>{formatMoney(report.summary.totalSaleValue)}</strong>
            </Card>
            <Card className={styles.statCard}>
              <Calculator size={20} aria-hidden />
              <span>Custo ingredientes</span>
              <strong>{formatMoney(report.summary.totalIngredientCost)}</strong>
            </Card>
            <Card className={styles.statCard}>
              <WalletCards size={20} aria-hidden />
              <span>Lucro bruto</span>
              <strong>{formatMoney(report.summary.totalGrossProfit)}</strong>
            </Card>
            <Card className={styles.statCard}>
              <LineChart size={20} aria-hidden />
              <span>Margem media</span>
              <strong>{formatPercent(report.summary.grossMarginPercent)}%</strong>
            </Card>
          </div>

          <div className={styles.insightGrid}>
            <Card className={styles.insightCard}>
              <span>Taxa de preparo no catalogo</span>
              <strong>{formatMoney(report.summary.totalPreparationFee)}</strong>
            </Card>
            <Card className={styles.insightCard}>
              <span>CMV consolidado</span>
              <strong>{formatPercent(report.summary.cmvPercent)}%</strong>
            </Card>
            <Card className={styles.insightCard}>
              <span>Menor margem</span>
              <strong>{weakestMargin ? weakestMargin.name : "---"}</strong>
              <small>{weakestMargin ? `${formatPercent(weakestMargin.grossMarginPercent)}%` : "sem produtos"}</small>
            </Card>
          </div>

          <Card className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h3>Resumo por categoria</h3>
              <span>{report.categories.length} categorias</span>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Itens</th>
                    <th>Venda</th>
                    <th>Custo</th>
                    <th>Preparo</th>
                    <th>Lucro</th>
                    <th>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((category) => (
                    <tr key={category.category}>
                      <td>{category.category}</td>
                      <td>{category.productsCount}</td>
                      <td>{formatMoney(category.saleValue)}</td>
                      <td>{formatMoney(category.ingredientCost)}</td>
                      <td>{formatMoney(category.preparationFee)}</td>
                      <td>{formatMoney(category.grossProfit)}</td>
                      <td>{formatPercent(category.grossMarginPercent)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <h3>Produtos, custo e venda</h3>
              <span>{report.rows.length} produtos</span>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Venda</th>
                    <th>Custo</th>
                    <th>Receita ingredientes</th>
                    <th>Taxa preparo</th>
                    <th>Lucro</th>
                    <th>Margem</th>
                    <th>CMV</th>
                    <th>Markup</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row.productId}>
                      <td>
                        <strong>{row.name}</strong>
                        <span>{row.sku}</span>
                      </td>
                      <td>{row.category}</td>
                      <td>{formatMoney(row.salePrice)}</td>
                      <td>{formatMoney(row.ingredientCost)}</td>
                      <td>{formatMoney(row.ingredientRevenueBase)}</td>
                      <td>{formatMoney(row.preparationFee)}</td>
                      <td>{formatMoney(row.grossProfit)}</td>
                      <td>{formatPercent(row.grossMarginPercent)}%</td>
                      <td>{formatPercent(row.cmvPercent)}%</td>
                      <td>{markupLabel(row.markup)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </section>
  );
}
