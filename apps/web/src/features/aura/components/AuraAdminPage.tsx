"use client";

import { FileSignature, PlusCircle, RefreshCcw, ShieldCheck, WalletCards } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { taxRegimeLabels } from "@/features/company/types";
import { formatMoney } from "@/lib/utils/money";
import {
  createAuraContract,
  createAuraCustomer,
  createAuraPayment,
  createAuraPlan,
  getAuraCustomers,
  getAuraPlans,
  getAuraSummary,
  updateAuraAccess,
} from "../api/auraApi";
import type { AuraCustomer, AuraPlan, AuraSummary } from "../types";
import styles from "./AuraAdminPage.module.css";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function numberValue(value: string | number) {
  return Number(value ?? 0);
}

export function AuraAdminPage() {
  const [summary, setSummary] = useState<AuraSummary | null>(null);
  const [plans, setPlans] = useState<AuraPlan[]>([]);
  const [customers, setCustomers] = useState<AuraCustomer[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "Start",
    description: "",
    monthlyPrice: 297,
    setupFee: 0,
    maxStores: 1,
    features: "1 loja; produtos compostos; assistente fiscal; relatorios financeiros",
    active: true,
  });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    password: "plux1234",
    legalName: "",
    tradeName: "",
    document: "",
    phone: "",
    taxRegime: "SIMPLES",
    notes: "",
  });

  async function refresh() {
    const [summaryData, planData, customerData] = await Promise.all([
      getAuraSummary(),
      getAuraPlans(),
      getAuraCustomers(),
    ]);
    setSummary(summaryData);
    setPlans(planData);
    setCustomers(customerData);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, []);

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await createAuraPlan(planForm);
      setMessage("Plano criado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar plano.");
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await createAuraCustomer(customerForm);
      setCustomerForm((current) => ({
        ...current,
        name: "",
        email: "",
        legalName: "",
        tradeName: "",
        document: "",
        phone: "",
        notes: "",
      }));
      setMessage("Cliente cadastrado como pendente.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente.");
    }
  }

  async function handleActivateContract(customer: AuraCustomer) {
    const plan = plans[0];

    if (!plan) {
      setError("Cadastre um plano antes de gerar contrato.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const code = `AURA-${Date.now().toString().slice(-8)}`;
      await createAuraContract(customer.id, {
        planId: plan.id,
        code,
        status: "ACTIVE",
        startsAt: todayInput(),
        paymentCurrentUntil: plusDaysInput(30),
        notes: `Contrato ${code} gerado pelo painel Aura.`,
      });
      setMessage(`Contrato ativo criado para ${customer.legalName}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar contrato.");
    }
  }

  async function handlePaidPayment(customer: AuraCustomer) {
    const contract = customer.contracts[0];
    const amount = numberValue(contract?.monthlyPriceSnapshot ?? plans[0]?.monthlyPrice ?? 0);

    if (amount <= 0) {
      setError("Valor do pagamento invalido. Cadastre um plano ou contrato.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await createAuraPayment(customer.id, {
        contractId: contract?.id,
        amount,
        dueDate: todayInput(),
        paidThrough: plusDaysInput(30),
        status: "PAID",
        method: "PIX",
        reference: `PIX-${Date.now().toString().slice(-6)}`,
        notes: "Pagamento confirmado pelo painel Aura.",
      });
      setMessage(`Pagamento confirmado para ${customer.legalName}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    }
  }

  async function handleSuspend(customer: AuraCustomer) {
    setError(null);
    setMessage(null);

    try {
      await updateAuraAccess(customer.id, {
        status: "SUSPENDED",
        accessEnabled: false,
        paymentCurrentUntil: customer.paymentCurrentUntil ?? null,
        notes: "Acesso suspenso pelo painel Aura.",
      });
      setMessage(`Acesso suspenso para ${customer.legalName}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao suspender acesso.");
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Backoffice Aura</p>
          <h2>Gestao de clientes, contratos e planos</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => refresh()}>
          <RefreshCcw size={16} aria-hidden />
          Atualizar
        </Button>
      </div>

      {message ? <div className={styles.success}>{message}</div> : null}
      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <ShieldCheck size={18} aria-hidden />
          <span>Clientes</span>
          <strong>{summary?.customersCount ?? 0}</strong>
        </Card>
        <Card className={styles.statCard}>
          <ShieldCheck size={18} aria-hidden />
          <span>Ativos</span>
          <strong>{summary?.activeCustomersCount ?? 0}</strong>
        </Card>
        <Card className={styles.statCard}>
          <FileSignature size={18} aria-hidden />
          <span>Pendentes</span>
          <strong>{summary?.pendingCustomersCount ?? 0}</strong>
        </Card>
        <Card className={styles.statCard}>
          <WalletCards size={18} aria-hidden />
          <span>Vencidos</span>
          <strong>{summary?.overduePaymentsCount ?? 0}</strong>
        </Card>
        <Card className={styles.statCard}>
          <WalletCards size={18} aria-hidden />
          <span>Recebido</span>
          <strong>{formatMoney(summary?.paidRevenue ?? 0)}</strong>
        </Card>
      </div>

      <div className={styles.grid}>
        <div className={styles.formCard}>
          <h3>Novo plano</h3>
          <form className={styles.form} onSubmit={handleCreatePlan}>
            <div className={styles.twoCols}>
              <Input label="Plano" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} />
              <Input
                label="Mensalidade"
                type="number"
                step="0.01"
                value={planForm.monthlyPrice}
                onChange={(event) => setPlanForm({ ...planForm, monthlyPrice: Number(event.target.value) })}
              />
              <Input
                label="Implantacao"
                type="number"
                step="0.01"
                value={planForm.setupFee}
                onChange={(event) => setPlanForm({ ...planForm, setupFee: Number(event.target.value) })}
              />
              <Input
                label="Max. lojas"
                type="number"
                value={planForm.maxStores}
                onChange={(event) => setPlanForm({ ...planForm, maxStores: Number(event.target.value) })}
              />
            </div>
            <label className={styles.textareaField}>
              <span>Recursos</span>
              <textarea value={planForm.features} onChange={(event) => setPlanForm({ ...planForm, features: event.target.value })} />
            </label>
            <Button type="submit">
              <PlusCircle size={16} aria-hidden />
              Criar plano
            </Button>
          </form>

          <h3>Novo cliente</h3>
          <form className={styles.form} onSubmit={handleCreateCustomer}>
            <div className={styles.twoCols}>
              <Input label="Responsavel" value={customerForm.name} required onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} />
              <Input label="E-mail" type="email" value={customerForm.email} required onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} />
              <Input label="Senha provisoria" value={customerForm.password} required onChange={(event) => setCustomerForm({ ...customerForm, password: event.target.value })} />
              <Select label="Regime" value={customerForm.taxRegime} onChange={(event) => setCustomerForm({ ...customerForm, taxRegime: event.target.value })}>
                <option value="SIMPLES">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro presumido</option>
                <option value="LUCRO_REAL">Lucro real</option>
              </Select>
              <Input label="Razao social" value={customerForm.legalName} required onChange={(event) => setCustomerForm({ ...customerForm, legalName: event.target.value })} />
              <Input label="Nome fantasia" value={customerForm.tradeName} onChange={(event) => setCustomerForm({ ...customerForm, tradeName: event.target.value })} />
              <Input label="CNPJ/CPF" value={customerForm.document} onChange={(event) => setCustomerForm({ ...customerForm, document: event.target.value })} />
              <Input label="Telefone" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
            </div>
            <Button type="submit">
              <PlusCircle size={16} aria-hidden />
              Cadastrar cliente
            </Button>
          </form>
        </div>

        <Card className={styles.customersCard}>
          <h3>Clientes Aura</h3>
          {customers.length === 0 ? <div className={styles.empty}>Nenhum cliente cadastrado.</div> : null}
          <div className={styles.customerList}>
            {customers.map((customer) => {
              const latestContract = customer.contracts[0];
              const latestPayment = customer.payments[0];
              const accessClass = customer.accessEnabled ? styles.accessOn : styles.accessOff;

              return (
                <div className={styles.customerCard} key={customer.id}>
                  <div className={styles.customerHeader}>
                    <div>
                      <h4>{customer.tradeName || customer.legalName}</h4>
                      <p>{customer.user.email}</p>
                    </div>
                    <span className={`${styles.statusPill} ${accessClass}`}>
                      {customer.status} · {customer.accessEnabled ? "liberado" : "bloqueado"}
                    </span>
                  </div>

                  <div className={styles.twoCols}>
                    <div>
                      <span className={styles.miniLabel}>Regime</span>
                      <strong>{taxRegimeLabels[customer.taxRegime]}</strong>
                    </div>
                    <div>
                      <span className={styles.miniLabel}>Vigencia</span>
                      <strong>
                        {customer.paymentCurrentUntil
                          ? new Date(customer.paymentCurrentUntil).toLocaleDateString("pt-BR")
                          : "Sem pagamento"}
                      </strong>
                    </div>
                    <div>
                      <span className={styles.miniLabel}>Contrato</span>
                      <strong>{latestContract ? `${latestContract.code} · ${latestContract.plan.name}` : "Sem contrato"}</strong>
                    </div>
                    <div>
                      <span className={styles.miniLabel}>Pagamento</span>
                      <strong>{latestPayment ? `${latestPayment.status} · ${formatMoney(numberValue(latestPayment.amount))}` : "Sem pagamento"}</strong>
                    </div>
                  </div>

                  <div className={styles.customerActions}>
                    <div className={styles.actionBox}>
                      <span className={styles.miniLabel}>Contrato</span>
                      <Button type="button" onClick={() => handleActivateContract(customer)}>
                        <FileSignature size={16} aria-hidden />
                        Gerar e liberar
                      </Button>
                    </div>
                    <div className={styles.actionBox}>
                      <span className={styles.miniLabel}>Pagamento</span>
                      <Button type="button" variant="secondary" onClick={() => handlePaidPayment(customer)}>
                        <WalletCards size={16} aria-hidden />
                        Confirmar 30 dias
                      </Button>
                    </div>
                    <div className={styles.actionBox}>
                      <span className={styles.miniLabel}>Acesso</span>
                      <Button type="button" variant="danger" onClick={() => handleSuspend(customer)}>
                        Suspender
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
