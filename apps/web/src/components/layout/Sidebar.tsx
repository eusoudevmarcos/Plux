"use client";

import { BarChart3, Boxes, ChefHat, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/ingredientes", label: "Ingredientes", icon: Boxes },
  { href: "/produtos/novo", label: "Novo produto", icon: PlusCircle },
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

