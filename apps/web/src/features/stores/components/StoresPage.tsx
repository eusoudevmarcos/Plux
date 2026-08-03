"use client";

import { Building2, PlusCircle, Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { taxRegimeLabels } from "@/features/company/types";
import { getStores } from "../api/storesApi";
import { setActiveStore } from "../activeStore";
import type { Store } from "../types";
import styles from "./Stores.module.css";

export function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStores()
      .then((data) => {
        if (data.length === 0) {
          router.replace("/lojas/novo");
          return;
        }

        setStores(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  function openStore(store: Store) {
    setActiveStore(store);
    router.push("/caixa");
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Clientes e lojas</p>
          <h2>Selecionar loja</h2>
        </div>
        <Link href="/lojas/novo">
          <Button>
            <PlusCircle size={16} aria-hidden />
            Nova loja
          </Button>
        </Link>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Carregando lojas...</div> : null}

      <div className={styles.grid}>
        {stores.map((store) => (
          <Card className={styles.storeCard} key={store.id}>
            <div>
              <StoreIcon size={22} aria-hidden />
              <h3>{store.tradeName}</h3>
              <p>{store.legalName}</p>
            </div>

            <div className={styles.meta}>
              <span>CNPJ/CPF</span>
              <strong>{store.document || "Nao informado"}</strong>
              <span>Endereco</span>
              <strong>
                {store.addressLine}, {store.addressNumber} · {store.district} · {store.city}/{store.state}
              </strong>
              <span>Regime</span>
              <strong>{taxRegimeLabels[store.taxRegime]}</strong>
            </div>

            <div className={styles.actions}>
              <Button type="button" onClick={() => openStore(store)}>
                <Building2 size={16} aria-hidden />
                Abrir caixa
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
