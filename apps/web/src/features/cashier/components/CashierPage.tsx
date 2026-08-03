"use client";

import { ArrowRightLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { taxRegimeLabels } from "@/features/company/types";
import { getProducts } from "@/features/products/api/productsApi";
import type { Product } from "@/features/products/types";
import { getActiveStore } from "@/features/stores/activeStore";
import type { Store } from "@/features/stores/types";
import { formatMoney } from "@/lib/utils/money";
import styles from "./CashierPage.module.css";

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

export function CashierPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeStore = getActiveStore();

    if (!activeStore) {
      router.replace("/lojas");
      return;
    }

    setStore(activeStore);
    getProducts()
      .then(setProducts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Operacao da loja</p>
          <h2>Caixa</h2>
        </div>
        <Link href="/lojas">
          <Button variant="secondary">
            <ArrowRightLeft size={16} aria-hidden />
            Trocar loja
          </Button>
        </Link>
      </div>

      {store ? (
        <Card className={styles.storeCard}>
          <div>
            <h3>{store.tradeName}</h3>
            <p>
              {store.addressLine}, {store.addressNumber} · {store.district} · {store.city}/{store.state}
            </p>
          </div>
          <div className={styles.regime}>{taxRegimeLabels[store.taxRegime]}</div>
        </Card>
      ) : null}

      {error ? <div className={styles.alert}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Carregando produtos do regime da loja...</div> : null}
      {!loading && products.length === 0 ? (
        <div className={styles.empty}>Nenhum produto configurado para o regime desta loja.</div>
      ) : null}

      <div className={styles.productGrid}>
        {products.map((product) => (
          <Card className={styles.productCard} key={product.id}>
            <span>{product.category}</span>
            <h3>{product.name}</h3>
            <div className={styles.price}>{formatMoney(numberValue(product.salePrice))}</div>
            <div className={styles.fiscalLine}>
              {product.taxProfile
                ? `${product.taxProfile.taxRegime} · ${product.taxProfile.cstIbsCbs}/${product.taxProfile.cClassTrib}`
                : "Sem perfil fiscal"}
            </div>
            <Button type="button">
              <ShoppingCart size={16} aria-hidden />
              Lancar item
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
