"use client";

import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, Calculator, LockKeyhole, ReceiptText, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  closeCashRegister,
  createCashMovement,
  getCurrentCashRegister,
  openCashRegister,
  type CashMovementType,
  type CashRegister,
} from "@/features/cashRegister/api/cashRegisterApi";
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

function parseMoneyInput(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function formatDateTime(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function movementLabel(type: CashMovementType) {
  const labels: Record<CashMovementType, string> = {
    ABERTURA: "Abertura",
    VENDA: "Venda",
    SANGRIA: "Sangria",
    SUPRIMENTO: "Suprimento",
    FECHAMENTO: "Fechamento",
  };

  return labels[type];
}

function expectedBalance(register: CashRegister | null) {
  if (!register) return 0;

  return (register.movements ?? []).reduce((sum, movement) => {
    const amount = numberValue(movement.amount);

    if (movement.type === "SANGRIA") return sum - amount;
    if (movement.type === "FECHAMENTO") return sum;

    return sum + amount;
  }, 0);
}

type CartItem = {
  product: Product;
  quantity: number;
};

export function CashierPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [movementType, setMovementType] = useState<"SUPRIMENTO" | "SANGRIA">("SUPRIMENTO");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const activeStore = getActiveStore();

    if (!activeStore) {
      router.replace("/lojas");
      return;
    }

    setStore(activeStore);
    Promise.all([getProducts(), getCurrentCashRegister(activeStore.id)])
      .then(([productList, currentCashRegister]) => {
        setProducts(productList);
        setCashRegister(currentCashRegister);
        setClosingBalance(currentCashRegister ? String(expectedBalance(currentCashRegister).toFixed(2)) : "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const total = cart.reduce((sum, item) => sum + numberValue(item.product.salePrice) * item.quantity, 0);
  const cashExpected = expectedBalance(cashRegister);
  const salesTotal = (cashRegister?.movements ?? [])
    .filter((movement) => movement.type === "VENDA")
    .reduce((sum, movement) => sum + numberValue(movement.amount), 0);

  async function refreshCashRegister(storeId = store?.id) {
    if (!storeId) return;

    const currentCashRegister = await getCurrentCashRegister(storeId);
    setCashRegister(currentCashRegister);
    setClosingBalance(currentCashRegister ? String(expectedBalance(currentCashRegister).toFixed(2)) : "");
  }

  function addToCart(product: Product) {
    if (!cashRegister) {
      setError("Abra o caixa antes de lançar itens.");
      return;
    }

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
    if (!cashRegister) {
      setError("Abra o caixa antes de finalizar vendas.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sale = await checkoutSale({
        storeId: store.id,
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        payments: [{ method: paymentMethod, amount: Number(total.toFixed(2)) }],
      });
      setCart([]);
      setSuccess(`Venda #${sale.number} finalizada com sucesso.`);
      await refreshCashRegister(store.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar venda");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenCashRegister() {
    if (!store) return;

    const amount = parseMoneyInput(openingBalance);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Informe um saldo inicial válido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await openCashRegister({ storeId: store.id, openingBalance: amount });
      await refreshCashRegister(store.id);
      setSuccess("Caixa aberto. A loja já pode vender.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir caixa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateMovement() {
    if (!cashRegister || !store) return;

    const amount = parseMoneyInput(movementAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe um valor válido para o movimento.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createCashMovement(cashRegister.id, {
        type: movementType,
        amount,
        description: movementDescription || null,
      });
      setMovementAmount("");
      setMovementDescription("");
      await refreshCashRegister(store.id);
      setSuccess(`${movementType === "SANGRIA" ? "Sangria" : "Suprimento"} registrado no caixa.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar movimento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseCashRegister() {
    if (!cashRegister || !store) return;

    const amount = parseMoneyInput(closingBalance);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Informe um valor válido para fechamento.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const closed = await closeCashRegister(cashRegister.id, { closingBalanceInformed: amount });
      setCashRegister(null);
      setCart([]);
      setClosingBalance("");
      setSuccess(`Caixa fechado. Diferença apurada: ${formatMoney(numberValue(closed.difference))}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fechar caixa.");
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
      {success ? <div className={styles.success}>{success}</div> : null}
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
              <Button type="button" disabled={!cashRegister} onClick={() => addToCart(product)}>
                <ShoppingCart size={16} aria-hidden />
                Lançar item
              </Button>
            </Card>
          ))}
        </div>

        <div className={styles.sideStack}>
          <Card className={styles.cashStatusCard}>
            <div className={styles.cashStatusHeader}>
              <div>
                <span className={styles.statusLabel}>{cashRegister ? "Caixa aberto" : "Caixa fechado"}</span>
                <h3>{cashRegister ? formatMoney(cashExpected) : "Abrir operação"}</h3>
                {cashRegister ? <p>Aberto em {formatDateTime(cashRegister.openedAt)}</p> : <p>Informe o saldo inicial para começar.</p>}
              </div>
              <div className={cashRegister ? styles.openBadge : styles.closedBadge}>
                {cashRegister ? <Calculator size={18} aria-hidden /> : <LockKeyhole size={18} aria-hidden />}
              </div>
            </div>

            {cashRegister ? (
              <div className={styles.cashMetrics}>
                <div>
                  <span>Vendas</span>
                  <strong>{formatMoney(salesTotal)}</strong>
                </div>
                <div>
                  <span>Movimentos</span>
                  <strong>{cashRegister.movements?.length ?? 0}</strong>
                </div>
              </div>
            ) : (
              <div className={styles.openCashForm}>
                <Input
                  label="Saldo inicial"
                  inputMode="decimal"
                  min="0"
                  name="openingBalance"
                  onChange={(event) => setOpeningBalance(event.target.value)}
                  type="number"
                  value={openingBalance}
                />
                <Button type="button" disabled={!store || submitting} onClick={handleOpenCashRegister}>
                  <Calculator size={16} aria-hidden />
                  Abrir caixa
                </Button>
              </div>
            )}
          </Card>

          <Card className={styles.cartCard}>
            <div className={styles.cartHeader}>
              <h3>Venda atual</h3>
              <strong>{formatMoney(total)}</strong>
            </div>

            {cart.length === 0 ? (
              <div className={styles.emptyCart}>{cashRegister ? "Selecione produtos para montar a venda." : "Abra o caixa para lançar itens."}</div>
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

            <Button type="button" disabled={!store || !cashRegister || cart.length === 0 || submitting} onClick={finishSale}>
              <ShoppingCart size={16} aria-hidden />
              {submitting ? "Finalizando..." : "Finalizar venda"}
            </Button>
          </Card>

          {cashRegister ? (
            <>
              <Card className={styles.operationCard}>
                <div className={styles.cardTitle}>
                  <h3>Movimento de caixa</h3>
                </div>
                <Select label="Tipo" name="movementType" value={movementType} onChange={(event) => setMovementType(event.target.value as "SUPRIMENTO" | "SANGRIA")}>
                  <option value="SUPRIMENTO">Suprimento</option>
                  <option value="SANGRIA">Sangria</option>
                </Select>
                <Input
                  label="Valor"
                  inputMode="decimal"
                  min="0"
                  name="movementAmount"
                  onChange={(event) => setMovementAmount(event.target.value)}
                  type="number"
                  value={movementAmount}
                />
                <Input
                  label="Descrição"
                  name="movementDescription"
                  onChange={(event) => setMovementDescription(event.target.value)}
                  placeholder="Ex: troco, retirada parcial"
                  value={movementDescription}
                />
                <Button type="button" disabled={submitting} onClick={handleCreateMovement} variant="secondary">
                  {movementType === "SANGRIA" ? <ArrowDownCircle size={16} aria-hidden /> : <ArrowUpCircle size={16} aria-hidden />}
                  Registrar
                </Button>
              </Card>

              <Card className={styles.operationCard}>
                <div className={styles.cardTitle}>
                  <h3>Fechamento</h3>
                  <span>Esperado {formatMoney(cashExpected)}</span>
                </div>
                <Input
                  label="Valor contado"
                  inputMode="decimal"
                  min="0"
                  name="closingBalance"
                  onChange={(event) => setClosingBalance(event.target.value)}
                  type="number"
                  value={closingBalance}
                />
                <Button type="button" disabled={submitting} onClick={handleCloseCashRegister} variant="danger">
                  <LockKeyhole size={16} aria-hidden />
                  Fechar caixa
                </Button>
              </Card>

              <Card className={styles.historyCard}>
                <div className={styles.cardTitle}>
                  <h3>Últimas vendas</h3>
                  <ReceiptText size={16} aria-hidden />
                </div>
                {(cashRegister.sales ?? []).length === 0 ? (
                  <div className={styles.miniEmpty}>Nenhuma venda neste caixa.</div>
                ) : (
                  <div className={styles.historyList}>
                    {(cashRegister.sales ?? []).map((sale) => (
                      <div className={styles.historyItem} key={sale.id}>
                        <div>
                          <strong>Venda #{sale.number}</strong>
                          <span>{formatDateTime(sale.closedAt ?? sale.createdAt)}</span>
                        </div>
                        <b>{formatMoney(numberValue(sale.total))}</b>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.cardTitle}>
                  <h3>Movimentos</h3>
                </div>
                {(cashRegister.movements ?? []).length === 0 ? (
                  <div className={styles.miniEmpty}>Sem movimentos.</div>
                ) : (
                  <div className={styles.historyList}>
                    {(cashRegister.movements ?? []).slice(0, 12).map((movement) => (
                      <div className={styles.historyItem} key={movement.id}>
                        <div>
                          <strong>{movementLabel(movement.type)}</strong>
                          <span>{movement.description || formatDateTime(movement.createdAt)}</span>
                        </div>
                        <b>{movement.type === "SANGRIA" ? "-" : ""}{formatMoney(numberValue(movement.amount))}</b>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
