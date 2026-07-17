"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getTaxClassifications } from "../api/taxApi";
import type { TaxClassification } from "../types";
import styles from "./TaxCatalogPage.module.css";

function numberValue(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

export function TaxCatalogPage() {
  const [taxClassifications, setTaxClassifications] = useState<TaxClassification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTaxClassifications()
      .then(setTaxClassifications)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    return {
      total: taxClassifications.length,
      zeroReduction: taxClassifications.filter((item) => numberValue(item.pRedIbs) === 100 && numberValue(item.pRedCbs) === 100)
        .length,
      fullTax: taxClassifications.filter((item) => item.cstIbsCbs === "000").length,
    };
  }, [taxClassifications]);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Base fiscal versionada</p>
          <h2>Catálogo CST e cClassTrib</h2>
        </div>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span>Classes</span>
          <strong>{stats.total}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span>Redução 100%</span>
          <strong>{stats.zeroReduction}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span>Integrais</span>
          <strong>{stats.fullTax}</strong>
        </Card>
      </div>

      <Card className={styles.tableCard}>
        {loading ? <div className={styles.empty}>Carregando catálogo fiscal...</div> : null}
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>CST</th>
                <th>cClassTrib</th>
                <th>Nome</th>
                <th>Red. IBS</th>
                <th>Red. CBS</th>
                <th>Docs</th>
                <th>Fonte</th>
              </tr>
            </thead>
            <tbody>
              {taxClassifications.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.cstIbsCbs}</strong>
                    <span>{item.cstDescription}</span>
                  </td>
                  <td>
                    <strong>{item.cClassTrib}</strong>
                  </td>
                  <td>
                    <strong>{item.cClassName}</strong>
                    <span>{item.legalReference ?? "Sem referência informada"}</span>
                  </td>
                  <td>{numberValue(item.pRedIbs).toLocaleString("pt-BR")}%</td>
                  <td>{numberValue(item.pRedCbs).toLocaleString("pt-BR")}%</td>
                  <td>
                    <span>{item.appliesNfe ? "NF-e" : ""}</span>
                    <span>{item.appliesNfce ? "NFC-e" : ""}</span>
                    <span>{item.appliesNfse ? "NFS-e" : ""}</span>
                  </td>
                  <td>{item.sourceVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

