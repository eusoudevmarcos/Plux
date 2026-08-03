"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/features/auth/api/authApi";
import { clearAuthSession, getAuthToken, saveAuthUser } from "@/features/auth/authStorage";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import styles from "./layout.module.css";

const publicPaths = ["/login", "/cadastro"];
const accessPendingPath = "/assinatura";

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

    me()
      .then(({ user }) => {
        saveAuthUser(user);

        if (pathname.startsWith("/aura") && user.role !== "AURA_ADMIN") {
          router.replace(user.hasPlatformAccess ? "/lojas" : accessPendingPath);
          return;
        }

        if (user.role !== "AURA_ADMIN" && !user.hasPlatformAccess && pathname !== accessPendingPath) {
          router.replace(accessPendingPath);
          return;
        }

        if (user.hasPlatformAccess && pathname === accessPendingPath) {
          router.replace("/lojas");
          return;
        }

        setChecked(true);
      })
      .catch(() => {
        clearAuthSession();
        router.replace("/login");
      });
  }, [isPublic, pathname, router]);

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
