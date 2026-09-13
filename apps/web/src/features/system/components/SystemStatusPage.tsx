"use client";

import { AlertTriangle, CheckCircle2, CircleSlash, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getActiveStore } from "@/features/stores/activeStore";
import { getBetaReadiness, type BetaReadiness, type ReadinessLevel } from "../api/systemApi";
import styles from "./SystemStatusPage.module.css";

const levelLabels: Record<ReadinessLevel, string> = {
  OK: "Pronto",
  ATTENTION: "Atenção",
  BLOCKED: "Bloqueado",
};

function LevelIcon({ level }: { level: ReadinessLevel }) {
  if (level === "OK") return <CheckCircle2 size={18} aria-hidden />;
  if (level === "BLOCKED") return <CircleSlash size={18} aria-hidden />;
  return <AlertTriangle size={18} aria-hidden />;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function SystemStatusPage() {
  const [readiness, setReadiness] = useState<BetaReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeStore = getActiveStore();

  async function loadData() {
    setError(null);
    setLoading(true);
    try {
      const data = await getBetaReadiness(activeStore?.id);
      setReadiness(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Prontidão beta</p>
          <h2>Status do sistema</h2>
        </div>
        <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
          <RotateCw size={16} aria-hidden />
          Atualizar
        </Button>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <Card className={styles.summaryCard}>
        <div className={styles.statusBadge} data-level={readiness?.status ?? "ATTENTION"}>
          {readiness ? <LevelIcon level={readiness.status} /> : <AlertTriangle size={18} aria-hidden />}
          <span>{readiness ? levelLabels[readiness.status] : "Carregando"}</span>
        </div>
        <div>
          <span>Loja avaliada</span>
          <strong>{readiness?.store?.tradeName ?? activeStore?.tradeName ?? "Sem loja ativa"}</strong>
        </div>
        <div>
          <span>Atualizado</span>
          <strong>{readiness ? formatDateTime(readiness.generatedAt) : "--"}</strong>
        </div>
      </Card>

      {loading ? <div className={styles.empty}>Verificando itens da beta...</div> : null}

      {readiness ? (
        <div className={styles.checkGrid}>
          {readiness.checks.map((check) => (
            <Card className={styles.checkCard} key={check.title} data-level={check.level}>
              <div className={styles.checkIcon}>
                <LevelIcon level={check.level} />
              </div>
              <div>
                <span>{levelLabels[check.level]}</span>
                <strong>{check.title}</strong>
                <p>{check.detail}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
