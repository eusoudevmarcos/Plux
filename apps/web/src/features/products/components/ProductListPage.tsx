"use client";

import { PlusCircle, Power } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatPercent } from "@/lib/utils/money";
import { getProducts, updateProductActive } from "../api/productsApi";
import type { Product } from "../types";
import styles from "./ProductListPage.module.css";

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

function productCmv(product: Product) {
  return product.ingredients.reduce((sum, item) => sum + numberValue(item.totalCostSnapshot), 0);
}

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await getProducts();
    setProducts(data);
  }

  useEffect(() => {
    refresh()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.active);
    const averageMargin =
      products.length > 0
        ? products.reduce((sum, product) => {
            const salePrice = numberValue(product.salePrice);
            const margin = salePrice > 0 ? ((salePrice - productCmv(product)) / salePrice) * 100 : 0;
            return sum + margin;
          }, 0) / products.length
        : 0;

    return {
      activeCount: activeProducts.length,
      inactiveCount: products.length - activeProducts.length,
      averageMargin,
    };
  }, [products]);

  async function handleToggle(product: Product) {
    await updateProductActive(product.id, !product.active);
    await refresh();
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Cardápio operacional</p>
          <h2>Produtos</h2>
        </div>
        <Link href="/produtos/novo">
          <Button>
            <PlusCircle size={16} aria-hidden />
            Novo produto
          </Button>
        </Link>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span>Ativos</span>
          <strong>{stats.activeCount}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span>Inativos</span>
          <strong>{stats.inactiveCount}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span>Margem média</span>
          <strong>{formatPercent(stats.averageMargin)}%</strong>
        </Card>
      </div>

      {loading ? <div className={styles.empty}>Carregando produtos...</div> : null}

      <div className={styles.productGrid}>
        {products.map((product) => {
          const cmv = productCmv(product);
          const salePrice = numberValue(product.salePrice);
          const marginPercent = salePrice > 0 ? ((salePrice - cmv) / salePrice) * 100 : 0;

          return (
            <Card className={product.active ? styles.productCard : styles.inactiveProductCard} key={product.id}>
              <div className={styles.productHeader}>
                <div>
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <small>{product.sku}</small>
                </div>
                <Button
                  type="button"
                  variant={product.active ? "secondary" : "ghost"}
                  title={product.active ? "Desativar produto" : "Ativar produto"}
                  onClick={() => handleToggle(product)}
                >
                  <Power size={16} aria-hidden />
                  {product.active ? "Ativo" : "Inativo"}
                </Button>
              </div>

              <div className={styles.metrics}>
                <div>
                  <span>Preço</span>
                  <strong>{formatMoney(salePrice)}</strong>
                </div>
                <div>
                  <span>CMV</span>
                  <strong>{formatMoney(cmv)}</strong>
                </div>
                <div>
                  <span>Margem</span>
                  <strong>{formatPercent(marginPercent)}%</strong>
                </div>
              </div>

              <div className={styles.fiscalStrip}>
                <div>
                  <span>Produto</span>
                  <strong>
                    {product.taxProfile ? `${product.taxProfile.cstIbsCbs} · ${product.taxProfile.cClassTrib}` : "---"}
                  </strong>
                </div>
                <div>
                  <span>Preparo</span>
                  <strong>
                    {product.taxProfile
                      ? `${product.taxProfile.preparationFeeCstIbsCbs} · ${product.taxProfile.preparationFeeCClassTrib}`
                      : "---"}
                  </strong>
                </div>
              </div>

              <div className={styles.composition}>
                <h4>Composição</h4>
                {product.ingredients.map((item) => (
                  <div key={item.id}>
                    <span>{item.ingredient.name}</span>
                    <strong>
                      {Number(item.qtyUsed).toLocaleString("pt-BR")} {item.ingredient.unitMeasure}
                    </strong>
                    <small>{formatMoney(numberValue(item.totalCostSnapshot))}</small>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

