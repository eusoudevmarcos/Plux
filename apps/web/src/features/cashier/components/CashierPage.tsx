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
import { checkoutSale, type PaymentMethod } from "@/features/sales/api/salesApi";
import { getActiveStore } from "@/features/stores/activeStore";
import type { Store } from "@/features/stores/types";
import { formatMoney } from "@/lib/utils/money";
import styles from "./CashierPage.module.css";

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

type CartItem = {
  product: Product;
  quantity: number;
};

export function CashierPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [submitting, setSubmitting] = useState(false);
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

  const total = cart.reduce((sum, item) => sum + numberValue(item.product.salePrice) * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((current) => current.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
  }

  async function finishSale() {
    if (!store || cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const sale = await checkoutSale({
        storeId: store.id,
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        payments: [{ method: paymentMethod, amount: Number(total.toFixed(2)) }],
      });
      setCart([]);
      alert(`Venda #${sale.number} finalizada com sucesso.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar venda");
    } finally {
      setSubmitting(false);
    }
  }

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

      <div className={styles.cashierGrid}>
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
              <Button type="button" onClick={() => addToCart(product)}>
                <ShoppingCart size={16} aria-hidden />
                Lançar item
              </Button>
            </Card>
          ))}
        </div>

        <Card className={styles.cartCard}>
          <div className={styles.cartHeader}>
            <h3>Venda atual</h3>
            <strong>{formatMoney(total)}</strong>
          </div>

          {cart.length === 0 ? (
            <div className={styles.emptyCart}>Selecione produtos para montar a venda.</div>
          ) : (
            <div className={styles.cartList}>
              {cart.map((item) => (
                <div className={styles.cartItem} key={item.product.id}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{formatMoney(numberValue(item.product.salePrice))}</span>
                  </div>
                  <div className={styles.qtyControl}>
                    <button type="button" onClick={() => updateQty(item.product.id, item.quantity - 1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.product.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className={styles.paymentLabel}>
            Pagamento
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="DEBITO">Débito</option>
              <option value="CREDITO">Crédito</option>
              <option value="OUTRO">Outro</option>
            </select>
          </label>

          <Button type="button" disabled={!store || cart.length === 0 || submitting} onClick={finishSale}>
            <ShoppingCart size={16} aria-hidden />
            {submitting ? "Finalizando..." : "Finalizar venda"}
          </Button>
        </Card>
      </div>
    </section>
  );
}
