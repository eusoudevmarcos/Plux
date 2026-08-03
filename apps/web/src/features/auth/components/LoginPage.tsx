"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { saveAuthSession } from "../authStorage";
import { login } from "../api/authApi";
import styles from "./AuthPages.module.css";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await login({ email, password });
      saveAuthSession(session);
      router.replace(
        session.user.role === "AURA_ADMIN" ? "/aura" : session.user.hasPlatformAccess ? "/lojas" : "/assinatura",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.brand}>
          <span>PluxSales</span>
          <h1>Entrar</h1>
          <p>Acesse suas lojas, caixa, produtos e simulacoes fiscais.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="E-mail" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
          <Input
            label="Senha"
            type="password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <div className={styles.alert}>{error}</div> : null}
          <div className={styles.actions}>
            <Button type="submit" disabled={loading}>
              <LogIn size={16} aria-hidden />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <p className={styles.linkLine}>
          Ainda nao tem conta? <Link href="/cadastro">Criar cadastro</Link>
        </p>
      </section>
    </main>
  );
}
