"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { saveAuthSession } from "../authStorage";
import { register } from "../api/authApi";
import styles from "./AuthPages.module.css";

export function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await register({ name, email, password });
      saveAuthSession(session);
      router.replace(
        session.user.role === "AURA_ADMIN" ? "/aura" : session.user.hasPlatformAccess ? "/lojas" : "/assinatura",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.brand}>
          <span>PluxSales</span>
          <h1>Criar conta</h1>
          <p>Cadastre o acesso inicial para gerenciar uma ou varias lojas.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Nome completo" value={name} required onChange={(event) => setName(event.target.value)} />
          <Input label="E-mail" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
          <Input
            label="Senha"
            type="password"
            value={password}
            minLength={6}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <div className={styles.alert}>{error}</div> : null}
          <div className={styles.actions}>
            <Button type="submit" disabled={loading}>
              <UserPlus size={16} aria-hidden />
              {loading ? "Criando..." : "Criar cadastro"}
            </Button>
          </div>
        </form>

        <p className={styles.linkLine}>
          Ja tenho conta. <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
