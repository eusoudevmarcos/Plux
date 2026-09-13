"use client";

import {
  BarChart3,
  Boxes,
  Building2,
  ChefHat,
  ClipboardCheck,
  CircleDollarSign,
  FileText,
  LogOut,
  PackageOpen,
  PlusCircle,
  ShoppingBasket,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { clearAuthSession, getAuthUser } from "@/features/auth/authStorage";
import { logout } from "@/features/auth/api/authApi";
import styles from "./layout.module.css";

const items = [
  { href: "/lojas", label: "Lojas", icon: Building2 },
  { href: "/caixa", label: "Caixa", icon: Store },
  { href: "/compras", label: "Compras", icon: ShoppingBasket },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/ingredientes", label: "Ingredientes", icon: Boxes },
  { href: "/produtos", label: "Produtos", icon: PackageOpen },
  { href: "/produtos/novo", label: "Novo produto", icon: PlusCircle },
  { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/empresa", label: "Empresa", icon: Building2 },
  { href: "/fiscal", label: "Fiscal", icon: FileText },
  { href: "/status", label: "Status", icon: ClipboardCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getAuthUser();
  const visibleItems =
    user?.role === "AURA_ADMIN" ? [{ href: "/aura", label: "Aura", icon: CircleDollarSign }, ...items] : items;

  async function handleLogout() {
    await logout().catch(() => null);
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.brand}>
        <ChefHat size={24} aria-hidden />
        <span>PluxSales</span>
      </Link>

      <nav className={styles.nav}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className={active ? styles.activeNavItem : styles.navItem}>
              <Icon size={18} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button type="button" className={styles.logoutButton} onClick={handleLogout}>
        <LogOut size={18} aria-hidden />
        <span>Sair</span>
      </button>
    </aside>
  );
}
