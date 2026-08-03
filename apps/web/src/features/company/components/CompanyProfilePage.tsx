"use client";

import { Building2, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getCompanyProfile, saveCompanyProfile } from "../api/companyApi";
import type { CompanyProfileInput, TaxRegime } from "../types";
import { taxRegimeLabels } from "../types";
import styles from "./CompanyProfilePage.module.css";

const emptyProfile: CompanyProfileInput = {
  legalName: "",
  tradeName: "",
  document: "",
  taxRegime: "SIMPLES",
  uf: "DF",
  city: "",
};

export function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfileInput>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompanyProfile()
      .then((data) => {
        if (!data) {
          return;
        }

        setProfile({
          legalName: data.legalName,
          tradeName: data.tradeName ?? "",
          document: data.document ?? "",
          taxRegime: data.taxRegime,
          uf: data.uf,
          city: data.city ?? "",
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof CompanyProfileInput>(key: K, value: CompanyProfileInput[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await saveCompanyProfile({
        ...profile,
        legalName: profile.legalName.trim(),
        tradeName: profile.tradeName?.trim() || null,
        document: profile.document?.trim() || null,
        uf: profile.uf.trim().toUpperCase(),
        city: profile.city?.trim() || null,
      });
      setProfile({
        legalName: saved.legalName,
        tradeName: saved.tradeName ?? "",
        document: saved.document ?? "",
        taxRegime: saved.taxRegime,
        uf: saved.uf,
        city: saved.city ?? "",
      });
      setMessage("Cadastro da empresa atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Cliente da plataforma</p>
          <h2>Empresa e regime tributario</h2>
        </div>
        <div className={styles.badge}>
          <Building2 size={18} aria-hidden />
          {taxRegimeLabels[profile.taxRegime]}
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}
      {message ? <div className={styles.success}>{message}</div> : null}

      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.twoCols}>
              <Input
                label="Razao social"
                value={profile.legalName}
                required
                minLength={2}
                onChange={(event) => updateField("legalName", event.target.value)}
              />
              <Input
                label="Nome fantasia"
                value={profile.tradeName ?? ""}
                onChange={(event) => updateField("tradeName", event.target.value)}
              />
              <Input
                label="CNPJ/CPF"
                value={profile.document ?? ""}
                onChange={(event) => updateField("document", event.target.value)}
              />
              <Select
                label="Regime tributario"
                value={profile.taxRegime}
                onChange={(event) => updateField("taxRegime", event.target.value as TaxRegime)}
              >
                <option value="SIMPLES">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro presumido</option>
                <option value="LUCRO_REAL">Lucro real</option>
              </Select>
              <Input
                label="UF"
                value={profile.uf}
                maxLength={2}
                required
                onChange={(event) => updateField("uf", event.target.value.toUpperCase())}
              />
              <Input
                label="Cidade"
                value={profile.city ?? ""}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" disabled={saving || loading}>
                <Save size={16} aria-hidden />
                {saving ? "Salvando..." : "Salvar empresa"}
              </Button>
            </div>
          </form>
        </Card>

        <div className={styles.sidePanel}>
          <Card className={styles.regimeCard}>
            <span>Regime selecionado</span>
            <strong>{taxRegimeLabels[profile.taxRegime]}</strong>
          </Card>
          <Card className={styles.noteCard}>
            <h3>Impacto no sistema</h3>
            <p>
              O regime tributario passa a ser a configuracao-base do cliente para relatorios, cadastros
              fiscais e futuras simulacoes financeiras.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
