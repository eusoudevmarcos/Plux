"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/features/auth/authStorage";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import styles from "./layout.module.css";

const publicPaths = ["/login", "/cadastro"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = publicPaths.some((path) => pathname === path);
  const [checked, setChecked] = useState(isPublic);

  useEffect(() => {
    if (isPublic) {
      setChecked(true);
      return;
    }

    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!checked) {
    return null;
  }

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
