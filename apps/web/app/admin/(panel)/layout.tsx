"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(0);

  // Aviso de consultas nuevas: se actualiza al navegar y cada 60 s.
  useEffect(() => {
    let alive = true;
    const load = () =>
      adminFetch<{ count: number }>("/admin/inquiries/new-count")
        .then((r) => alive && setNewCount(r.count))
        .catch(() => undefined);
    void load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  async function logout() {
    await adminFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  const link = (href: string, label: string, badge?: number) => {
    const active = href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/autos") : pathname.startsWith(href);
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-1.5 hover:underline ${active ? "underline underline-offset-4" : ""}`}>
        {label}
        {badge ? (
          <span aria-label={`${badge} nuevas`} className="rounded-full bg-accent px-1.5 text-xs font-bold leading-5">{badge}</span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <header className="border-b border-black/10 bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <nav className="flex items-center gap-4 overflow-x-auto text-sm font-medium sm:gap-5">
            <span className="hidden font-bold sm:inline">Panel Batalla</span>
            {link("/admin", "Autos")}
            {link("/admin/consultas", "Consultas", newCount)}
            {link("/admin/configuracion", "Configuración")}
            <a href="/" target="_blank" className="whitespace-nowrap hover:underline">Ver sitio ↗</a>
          </nav>
          <button type="button" onClick={logout} className="rounded-full border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">
            Salir
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </>
  );
}
