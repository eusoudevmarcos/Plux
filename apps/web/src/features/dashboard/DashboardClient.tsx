"use client";

import { AlertTriangle, Boxes, Calculator, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getIngredients } from "@/features/ingredients/api/ingredientsApi";
import type { Ingredient } from "@/features/ingredients/types";
import { getProducts } from "@/features/products/api/productsApi";
import type { Product } from "@/features/products/types";
import { formatMoney, formatPercent } from "@/lib/utils/money";
import styles from "./Dashboard.module.css";

function numberValue(value: string | number) {
  return Number(value ?? 0);
}

export function DashboardClient() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getIngredients(), getProducts()])
      .then(([ingredientData, productData]) => {
        setIngredients(ingredientData);
        setProducts(productData);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const stats = useMemo(() => {
    const stockValue = ingredients.reduce(
      (sum, ingredient) => sum + numberValue(ingredient.unitCost) * numberValue(ingredient.stockCurrent),
      0,
    );
    const reviewCount = ingredients.filter((ingredient) => ingredient.taxConfidence !== "APPROVED").length;
    const averageCmv =
      products.length > 0
        ? products.reduce((sum, product) => {
            const cmv = product.ingredients.reduce((itemSum, item) => itemSum + numberValue(item.totalCostSnapshot), 0);
            return sum + (numberValue(product.salePrice) > 0 ? (cmv / numberValue(product.salePrice)) * 100 : 0);
          }, 0) / products.length
        : 0;

    return { stockValue, reviewCount, averageCmv };
  }, [ingredients, products]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p>Engenharia fiscal de cardápio</p>
          <h2>CMV, composição e tributação por linha em um só fluxo</h2>
        </div>
        <div className={styles.heroMetric}>
          <span>Taxa preparo padrão</span>
          <strong>{formatMoney(5)}</strong>
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <Boxes size={20} aria-hidden />
          <span>Ingredientes</span>
          <strong>{ingredients.length}</strong>
        </Card>
        <Card className={styles.statCard}>
          <Calculator size={20} aria-hidden />
          <span>CMV médio</span>
          <strong>{formatPercent(stats.averageCmv)}%</strong>
        </Card>
        <Card className={styles.statCard}>
          <ReceiptText size={20} aria-hidden />
          <span>Estoque custo</span>
          <strong>{formatMoney(stats.stockValue)}</strong>
        </Card>
        <Card className={styles.statCard}>
          <AlertTriangle size={20} aria-hidden />
          <span>Revisões fiscais</span>
          <strong>{stats.reviewCount}</strong>
        </Card>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <h3>Produtos cadastrados</h3>
          <span>{products.length} itens</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>CMV</th>
                <th>Estratégia</th>
                <th>Produto</th>
                <th>Preparo</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const cmv = product.ingredients.reduce((sum, item) => sum + numberValue(item.totalCostSnapshot), 0);

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </td>
                    <td>{formatMoney(numberValue(product.salePrice))}</td>
                    <td>{formatMoney(cmv)}</td>
                    <td>{product.fiscalStrategy === "SPLIT_INGREDIENTS_PREPARATION_FEE" ? "Split" : "Único"}</td>
                    <td>
                      {product.taxProfile ? `${product.taxProfile.cstIbsCbs} · ${product.taxProfile.cClassTrib}` : "---"}
                    </td>
                    <td>
                      {product.taxProfile
                        ? `${product.taxProfile.preparationFeeCstIbsCbs} · ${product.taxProfile.preparationFeeCClassTrib}`
                        : "---"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

