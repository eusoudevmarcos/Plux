import styles from "./layout.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Food service fiscal-first</p>
        <h1>PluxSales</h1>
      </div>
      <div className={styles.statusPill}>DF · Simples · IBS/CBS 2026</div>
    </header>
  );
}

