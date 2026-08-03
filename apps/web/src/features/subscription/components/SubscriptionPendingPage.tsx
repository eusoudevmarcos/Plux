"use client";

import { FileSignature, LockKeyhole, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getAuthUser } from "@/features/auth/authStorage";
import styles from "./SubscriptionPendingPage.module.css";

export function SubscriptionPendingPage() {
  const user = getAuthUser();
  const account = user?.customerAccount;

  return (
    <section className={styles.page}>
      <Card className={styles.panel}>
        <LockKeyhole size={28} aria-hidden />
        <h2>Acesso aguardando liberacao da Aura</h2>
        <p>
          Seu cadastro existe, mas a plataforma so e liberada depois que a Aura vincular um contrato ativo
          e confirmar o pagamento do plano. Quando a assinatura estiver vigente, o acesso a lojas, caixa,
          produtos e relatorios sera aberto automaticamente.
        </p>
      </Card>

      <div className={styles.statusGrid}>
        <Card className={styles.statusCard}>
          <FileSignature size={20} aria-hidden />
          <span>Status</span>
          <strong>{account?.status ?? "PENDING"}</strong>
        </Card>
        <Card className={styles.statusCard}>
          <WalletCards size={20} aria-hidden />
          <span>Acesso</span>
          <strong>{account?.accessEnabled ? "Liberado" : "Bloqueado"}</strong>
        </Card>
        <Card className={styles.statusCard}>
          <LockKeyhole size={20} aria-hidden />
          <span>Vigencia</span>
          <strong>
            {account?.paymentCurrentUntil
              ? new Date(account.paymentCurrentUntil).toLocaleDateString("pt-BR")
              : "Sem pagamento"}
          </strong>
        </Card>
      </div>
    </section>
  );
}
