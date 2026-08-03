"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TaxRegime } from "@/features/company/types";
import { createStore } from "../api/storesApi";
import { setActiveStore } from "../activeStore";
import type { StoreInput } from "../types";
import styles from "./Stores.module.css";

const defaultValues: StoreInput = {
  legalName: "",
  tradeName: "",
  document: "",
  taxRegime: "SIMPLES",
  state: "DF",
  city: "",
  district: "",
  addressLine: "",
  addressNumber: "",
  addressComplement: "",
  zipCode: "",
  active: true,
};

export function StoreFormPage() {
  const router = useRouter();
  const [values, setValues] = useState<StoreInput>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof StoreInput>(key: K, value: StoreInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const store = await createStore({
        ...values,
        document: values.document?.trim() || null,
        state: values.state.trim().toUpperCase(),
        addressComplement: values.addressComplement?.trim() || null,
        zipCode: values.zipCode?.trim() || null,
      });
      setActiveStore(store);
      router.replace("/caixa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar loja.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Nova loja</p>
          <h2>Cadastro do cliente operacional</h2>
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <Card className={styles.formCard}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.twoCols}>
            <Input
              label="Nome completo / razao social"
              value={values.legalName}
              required
              onChange={(event) => update("legalName", event.target.value)}
            />
            <Input
              label="Nome da loja"
              value={values.tradeName}
              required
              onChange={(event) => update("tradeName", event.target.value)}
            />
            <Input label="CNPJ/CPF" value={values.document ?? ""} onChange={(event) => update("document", event.target.value)} />
            <Select
              label="Regime tributario"
              value={values.taxRegime}
              onChange={(event) => update("taxRegime", event.target.value as TaxRegime)}
            >
              <option value="SIMPLES">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro presumido</option>
              <option value="LUCRO_REAL">Lucro real</option>
            </Select>
            <Input
              label="Estado"
              value={values.state}
              maxLength={2}
              required
              onChange={(event) => update("state", event.target.value.toUpperCase())}
            />
            <Input label="Cidade" value={values.city} required onChange={(event) => update("city", event.target.value)} />
            <Input label="Bairro" value={values.district} required onChange={(event) => update("district", event.target.value)} />
            <Input
              label="Endereco"
              value={values.addressLine}
              required
              onChange={(event) => update("addressLine", event.target.value)}
            />
            <Input
              label="Numero"
              value={values.addressNumber}
              required
              onChange={(event) => update("addressNumber", event.target.value)}
            />
            <Input
              label="Complemento"
              value={values.addressComplement ?? ""}
              onChange={(event) => update("addressComplement", event.target.value)}
            />
            <Input label="CEP" value={values.zipCode ?? ""} onChange={(event) => update("zipCode", event.target.value)} />
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={saving}>
              <Save size={16} aria-hidden />
              {saving ? "Salvando..." : "Salvar e abrir caixa"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
