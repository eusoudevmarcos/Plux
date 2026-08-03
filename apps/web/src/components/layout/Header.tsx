"use client";

import { useEffect, useState } from "react";
import { getCompanyProfile } from "@/features/company/api/companyApi";
import type { CompanyProfile } from "@/features/company/types";
import { taxRegimeLabels } from "@/features/company/types";
import styles from "./layout.module.css";

export function Header() {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    getCompanyProfile()
      .then(setCompanyProfile)
      .catch(() => setCompanyProfile(null));
  }, []);

  const status = companyProfile
    ? `${companyProfile.uf} · ${taxRegimeLabels[companyProfile.taxRegime]} · IBS/CBS 2026`
    : "Regime tributario pendente";

  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Food service fiscal-first</p>
        <h1>PluxSales</h1>
      </div>
      <div className={styles.statusPill}>{status}</div>
    </header>
  );
}
