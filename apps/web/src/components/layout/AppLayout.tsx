import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import styles from "./layout.module.css";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.mainArea}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

