"use client";

import { BarChart3, Boxes, Building2, ChefHat, CircleDollarSign, FileText, PackageOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/ingredientes", label: "Ingredientes", icon: Boxes },
  { href: "/produtos", label: "Produtos", icon: PackageOpen },
  { href: "/produtos/novo", label: "Novo produto", icon: PlusCircle },
  { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/empresa", label: "Empresa", icon: Building2 },
  { href: "/fiscal", label: "Fiscal", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.brand}>
        <ChefHat size={24} aria-hidden />
        <span>PluxSales</span>
      </Link>

      <nav className={styles.nav}>
        {items.map((item) => {
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
    </aside>
  );
}
