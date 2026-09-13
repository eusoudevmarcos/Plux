"use client";

import { CheckCircle2, Plus, ReceiptText, RotateCw, Save, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getIngredients } from "@/features/ingredients/api/ingredientsApi";
import type { Ingredient } from "@/features/ingredients/types";
import { getActiveStore } from "@/features/stores/activeStore";
import type { Store } from "@/features/stores/types";
import { formatMoney } from "@/lib/utils/money";
import {
  createPurchase,
  createSupplier,
  getAccountPayables,
  getPurchases,
  getSuppliers,
  markAccountPayablePaid,
} from "../api/purchasesApi";
import type { AccountPayable, Purchase, Supplier } from "../types";
import styles from "./PurchasesPage.module.css";

type DraftItem = {
  ingredientId: string;
  quantity: string;
  unitCost: string;
};

type SupplierDraft = {
  name: string;
  document: string;
  phone: string;
  email: string;
};

const emptyItem: DraftItem = { ingredientId: "", quantity: "", unitCost: "" };

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

function parseNumberInput(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function payableLabel(status: AccountPayable["status"]) {
  const labels: Record<AccountPayable["status"], string> = {
    OPEN: "Aberto",
    PAID: "Pago",
    CANCELED: "Cancelado",
  };

  return labels[status];
}

export function PurchasesPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [supplierDraft, setSupplierDraft] = useState<SupplierDraft>({ name: "", document: "", phone: "", email: "" });
  const [supplierId, setSupplierId] = useState("");
  const [issueDate, setIssueDate] = useState(todayInputValue());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...emptyItem }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingPayableId, setPayingPayableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData(storeId: string) {
    const [ingredientList, supplierList, purchaseList, payableList] = await Promise.all([
      getIngredients(),
      getSuppliers(storeId),
      getPurchases(storeId),
      getAccountPayables(storeId),
    ]);

    setIngredients(ingredientList);
    setSuppliers(supplierList);
    setPurchases(purchaseList);
    setPayables(payableList);
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

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = parseNumberInput(item.quantity || "0");
      const unitCost = parseNumberInput(item.unitCost || "0");

      if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) return sum;

      return sum + quantity * unitCost;
    }, 0);
  }, [items]);

  const openPayablesTotal = payables
    .filter((payable) => payable.status === "OPEN")
    .reduce((sum, payable) => sum + numberValue(payable.amount), 0);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const next = { ...item, ...patch };
        if (patch.ingredientId) {
          const ingredient = ingredients.find((candidate) => candidate.id === patch.ingredientId);
          if (ingredient && !item.unitCost) {
            next.unitCost = String(numberValue(ingredient.unitCost));
          }
        }

        return next;
      }),
    );
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? [{ ...emptyItem }] : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  async function handleCreateSupplier() {
    if (!store) return;
    if (!supplierDraft.name.trim()) {
      setError("Informe o nome do fornecedor.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const supplier = await createSupplier({
        storeId: store.id,
        name: supplierDraft.name,
        document: supplierDraft.document || null,
        phone: supplierDraft.phone || null,
        email: supplierDraft.email || null,
      });
      setSupplierDraft({ name: "", document: "", phone: "", email: "" });
      setSupplierId(supplier.id);
      await loadData(store.id);
      setSuccess("Fornecedor cadastrado e selecionado para a compra.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar fornecedor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePurchase() {
    if (!store) return;

    const normalizedItems = items
      .filter((item) => item.ingredientId)
      .map((item) => ({
        ingredientId: item.ingredientId,
        quantity: parseNumberInput(item.quantity),
        unitCost: parseNumberInput(item.unitCost),
      }));

    if (normalizedItems.length === 0) {
      setError("Inclua ao menos um ingrediente na compra.");
      return;
    }

    if (normalizedItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) {
      setError("Revise quantidade e custo unitário dos itens.");
      return;
    }

    if (new Set(normalizedItems.map((item) => item.ingredientId)).size !== normalizedItems.length) {
      setError("Cada ingrediente deve aparecer apenas uma vez na compra.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const purchase = await createPurchase({
        storeId: store.id,
        supplierId: supplierId || null,
        issueDate,
        dueDate: dueDate || null,
        notes: notes || null,
        items: normalizedItems,
      });

      setItems([{ ...emptyItem }]);
      setNotes("");
      setDueDate("");
      await loadData(store.id);
      setSuccess(`Compra #${purchase.number} lançada. Estoque e custo médio atualizados.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao lançar compra.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayablePaid(payable: AccountPayable) {
    if (!store || payable.status !== "OPEN") return;

    setPayingPayableId(payable.id);
    setError(null);
    setSuccess(null);
    try {
      await markAccountPayablePaid(payable.id, { notes: "Baixa manual pela tela de compras." });
      await loadData(store.id);
      setSuccess(`${payable.description} marcada como paga.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar conta a pagar.");
    } finally {
      setPayingPayableId(null);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Entradas e custo médio</p>
          <h2>Compras</h2>
        </div>
        <Button type="button" variant="secondary" disabled={!store || loading} onClick={() => store && loadData(store.id)}>
          <RotateCw size={16} aria-hidden />
          Atualizar
        </Button>
      </div>

      {store ? (
        <Card className={styles.storeCard}>
          <div>
            <span>Loja ativa</span>
            <strong>{store.tradeName}</strong>
          </div>
          <div>
            <span>A pagar aberto</span>
            <strong>{formatMoney(openPayablesTotal)}</strong>
          </div>
        </Card>
      ) : null}

      {error ? <div className={styles.alert}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}
      {loading ? <div className={styles.empty}>Carregando compras da loja...</div> : null}

      <div className={styles.grid}>
        <Card className={styles.purchaseCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Lançar compra</h3>
              <p>A entrada atualiza estoque, custo médio e CMV das fichas técnicas.</p>
            </div>
            <strong>{formatMoney(total)}</strong>
          </div>

          <div className={styles.formGrid}>
            <Select label="Fornecedor" name="supplierId" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Sem fornecedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
            <Input label="Emissão" name="issueDate" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            <Input label="Vencimento" name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <Input label="Observação" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className={styles.itemsHeader}>
            <h4>Itens</h4>
            <Button type="button" variant="secondary" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>
              <Plus size={16} aria-hidden />
              Item
            </Button>
          </div>

          <div className={styles.itemList}>
            {items.map((item, index) => {
              const ingredient = ingredients.find((candidate) => candidate.id === item.ingredientId);
              const lineTotal = parseNumberInput(item.quantity || "0") * parseNumberInput(item.unitCost || "0");

              return (
                <div className={styles.itemRow} key={`${item.ingredientId}-${index}`}>
                  <Select label="Ingrediente" value={item.ingredientId} onChange={(event) => updateItem(index, { ingredientId: event.target.value })}>
                    <option value="">Selecione</option>
                    {ingredients.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                  </Select>
                  <Input label={`Qtd. ${ingredient?.unitMeasure ?? ""}`} inputMode="decimal" min="0" type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} />
                  <Input label="Custo un." inputMode="decimal" min="0" type="number" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: event.target.value })} />
                  <div className={styles.lineTotal}>
                    <span>Total</span>
                    <strong>{formatMoney(Number.isFinite(lineTotal) ? lineTotal : 0)}</strong>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                    Remover
                  </Button>
                </div>
              );
            })}
          </div>

          <Button type="button" disabled={!store || submitting} onClick={handleCreatePurchase}>
            <Save size={16} aria-hidden />
            {submitting ? "Lançando..." : "Lançar compra"}
          </Button>
        </Card>

        <div className={styles.sideStack}>
          <Card className={styles.supplierCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Novo fornecedor</h3>
                <p>Cadastro rápido para usar na entrada.</p>
              </div>
              <Truck size={19} aria-hidden />
            </div>
            <Input label="Nome" value={supplierDraft.name} onChange={(event) => setSupplierDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input label="CNPJ/CPF" value={supplierDraft.document} onChange={(event) => setSupplierDraft((current) => ({ ...current, document: event.target.value }))} />
            <Input label="Telefone" value={supplierDraft.phone} onChange={(event) => setSupplierDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Input label="E-mail" type="email" value={supplierDraft.email} onChange={(event) => setSupplierDraft((current) => ({ ...current, email: event.target.value }))} />
            <Button type="button" variant="secondary" disabled={!store || submitting} onClick={handleCreateSupplier}>
              <Plus size={16} aria-hidden />
              Cadastrar fornecedor
            </Button>
          </Card>

          <Card className={styles.historyCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Compras recentes</h3>
                <p>Últimas entradas lançadas.</p>
              </div>
              <ReceiptText size={18} aria-hidden />
            </div>
            {purchases.length === 0 ? (
              <div className={styles.miniEmpty}>Nenhuma compra lançada.</div>
            ) : (
              <div className={styles.historyList}>
                {purchases.slice(0, 8).map((purchase) => (
                  <div className={styles.historyItem} key={purchase.id}>
                    <div>
                      <strong>Compra #{purchase.number}</strong>
                      <span>{purchase.supplier?.name ?? "Sem fornecedor"} · {formatDate(purchase.issueDate)}</span>
                    </div>
                    <b>{formatMoney(numberValue(purchase.total))}</b>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={styles.historyCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Contas a pagar</h3>
                <p>Geradas pelas compras com vencimento.</p>
              </div>
            </div>
            {payables.length === 0 ? (
              <div className={styles.miniEmpty}>Nenhuma conta em aberto.</div>
            ) : (
              <div className={styles.historyList}>
                {payables.slice(0, 8).map((payable) => (
                  <div className={styles.historyItem} key={payable.id}>
                    <div>
                      <strong>{payable.description}</strong>
                      <span>
                        {payableLabel(payable.status)} · vence {formatDate(payable.dueDate)}
                        {payable.paidAt ? ` · pago ${formatDate(payable.paidAt)}` : ""}
                      </span>
                    </div>
                    <div className={styles.payableActions}>
                      <b>{formatMoney(numberValue(payable.amount))}</b>
                      {payable.status === "OPEN" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={payingPayableId === payable.id}
                          onClick={() => handlePayablePaid(payable)}
                        >
                          <CheckCircle2 size={15} aria-hidden />
                          {payingPayableId === payable.id ? "Baixando..." : "Marcar pago"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
