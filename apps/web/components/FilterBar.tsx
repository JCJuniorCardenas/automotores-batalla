"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { CarFilters } from "@/lib/types";

const FIELD = "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent";
const LABEL = "flex flex-col gap-1 text-xs font-semibold text-black/70";

const SORTS = [
  ["recent", "Más recientes"],
  ["price_asc", "Menor precio"],
  ["price_desc", "Mayor precio"],
  ["year_desc", "Más nuevos"],
  ["km_asc", "Menos km"],
] as const;

export function FilterBar({ filters }: { filters: CarFilters | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [brand, setBrand] = useState(params.get("brand") ?? "");
  const [showMobile, setShowMobile] = useState(false);

  const models = filters?.brands.find((b) => b.brand === brand)?.models ?? [];
  const activeCount = [...params.keys()].filter((k) => k !== "page" && k !== "sort").length;

  function push(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [k, v] of data) if (typeof v === "string" && v.trim() !== "") next.set(k, v.trim());
    if (next.get("sort") === "recent") next.delete("sort");
    if (!next.get("currency")) {
      next.delete("priceMin");
      next.delete("priceMax");
    }
    push(next);
  }

  // `key` fuerza a los inputs a releer la URL cuando cambia (p. ej. al limpiar filtros).
  const formKey = params.toString();

  return (
    <section aria-label="Filtros" className="rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => setShowMobile((v) => !v)}
        aria-expanded={showMobile}
        className="flex w-full items-center justify-between font-semibold lg:cursor-default"
      >
        <span>
          Filtros{activeCount > 0 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">{activeCount}</span>}
        </span>
        <span aria-hidden="true" className={"text-black/50 lg:hidden " + (showMobile ? "rotate-180" : "")}>▾</span>
      </button>
      <form key={formKey} onSubmit={onSubmit} className={"mt-4 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-1 " + (showMobile ? "grid" : "hidden")} aria-busy={pending}>
        <label className={LABEL}>
          Buscar
          <input name="q" type="search" defaultValue={params.get("q") ?? ""} placeholder="Marca, modelo o versión" className={FIELD} />
        </label>
        <label className={LABEL}>
          Marca
          <select name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={FIELD}>
            <option value="">Todas</option>
            {filters?.brands.map((b) => (
              <option key={b.brand} value={b.brand}>{b.brand}</option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Modelo
          <select name="model" defaultValue={params.get("model") ?? ""} disabled={!brand} className={FIELD}>
            <option value="">Todos</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Tipo
          <select name="condition" defaultValue={params.get("condition") ?? ""} className={FIELD}>
            <option value="">0km y usados</option>
            <option value="ZERO_KM">0km</option>
            <option value="USED">Usados</option>
          </select>
        </label>
        <label className={LABEL}>
          Combustible
          <select name="fuel" defaultValue={params.get("fuel") ?? ""} className={FIELD}>
            <option value="">Todos</option>
            <option value="NAFTA">Nafta</option>
            <option value="DIESEL">Diésel</option>
            <option value="GNC">GNC</option>
            <option value="HIBRIDO">Híbrido</option>
            <option value="ELECTRICO">Eléctrico</option>
          </select>
        </label>
        <label className={LABEL}>
          Transmisión
          <select name="transmission" defaultValue={params.get("transmission") ?? ""} className={FIELD}>
            <option value="">Todas</option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATICA">Automática</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={LABEL}>
            Año desde
            <input name="yearMin" type="number" inputMode="numeric" defaultValue={params.get("yearMin") ?? ""} className={FIELD} />
          </label>
          <label className={LABEL}>
            Año hasta
            <input name="yearMax" type="number" inputMode="numeric" defaultValue={params.get("yearMax") ?? ""} className={FIELD} />
          </label>
        </div>
        <label className={LABEL}>
          Kilometraje máximo
          <input name="kmMax" type="number" inputMode="numeric" step={1000} defaultValue={params.get("kmMax") ?? ""} className={FIELD} />
        </label>
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-1 text-xs font-semibold text-black/70">Precio</legend>
          <select name="currency" aria-label="Moneda" defaultValue={params.get("currency") ?? ""} className={FIELD}>
            <option value="">Moneda</option>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <input name="priceMin" type="number" inputMode="numeric" aria-label="Precio mínimo" placeholder="Desde" defaultValue={params.get("priceMin") ?? ""} className={FIELD} />
          <input name="priceMax" type="number" inputMode="numeric" aria-label="Precio máximo" placeholder="Hasta" defaultValue={params.get("priceMax") ?? ""} className={FIELD} />
        </fieldset>
        <label className={LABEL}>
          Ordenar por
          <select name="sort" defaultValue={params.get("sort") ?? "recent"} className={FIELD}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Aplicar
          </button>
          {activeCount > 0 && (
            <button type="button" onClick={() => { setBrand(""); push(new URLSearchParams()); }} className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold hover:bg-black/5">
              Limpiar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
