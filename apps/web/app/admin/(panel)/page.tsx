"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CarStatusT } from "@batalla/shared";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";
import { carTitle, CONDITION_LABEL, formatPrice, STATUS_LABEL } from "@/lib/format";
import type { CarDTO, CarList } from "@/lib/types";

export default function AdminCarsPage() {
  const [data, setData] = useState<CarList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ page: String(page), pageSize: "20", sort: "recent" });
    if (q) qs.set("q", q);
    adminFetch<CarList>(`/admin/cars?${qs}`)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Error al cargar"));
    return () => {
      alive = false;
    };
  }, [q, page, tick]);

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      reload();
    } catch (e) {
      alert(e instanceof AdminApiError ? e.message : "No se pudo completar la acción");
    }
  }

  const setStatus = (c: CarDTO, status: CarStatusT) =>
    act(() => adminFetch(`/admin/cars/${c.id}/status`, jsonInit("PATCH", { status })));
  const toggleFeatured = (c: CarDTO) =>
    act(() => adminFetch(`/admin/cars/${c.id}/featured`, jsonInit("PATCH", { featured: !c.featured })));
  const remove = (c: CarDTO) => {
    if (confirm(`¿Eliminar "${carTitle(c)} ${c.year}"? Esta acción no se puede deshacer.`)) {
      void act(() => adminFetch(`/admin/cars/${c.id}`, { method: "DELETE" }));
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Autos</h1>
        <Link href="/admin/autos/nuevo" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
          + Nuevo auto
        </Link>
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Buscar por marca, modelo o versión"
        aria-label="Buscar autos"
        className="mt-4 w-full max-w-md rounded-md border border-black/15 bg-white px-3 py-2"
      />
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-red-700">
          {error} <button onClick={reload} className="underline">Reintentar</button>
        </p>
      )}
      {!data && !error && <p className="mt-6 text-black/60">Cargando…</p>}
      {data && data.items.length === 0 && <p className="mt-6 text-black/60">No hay autos que coincidan.</p>}
      {data && data.items.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-card bg-white shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-black/50">
              <tr>
                <th className="p-3">Auto</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Destacado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="p-3">
                    <p className="font-semibold">{carTitle(c)}</p>
                    <p className="text-black/60">{c.year} · {CONDITION_LABEL[c.condition]} · {c.photos.length} fotos</p>
                  </td>
                  <td className="p-3">{formatPrice(c.priceAmount, c.priceCurrency)}</td>
                  <td className="p-3">
                    <select
                      aria-label={`Estado de ${carTitle(c)}`}
                      value={c.status}
                      onChange={(e) => void setStatus(c, e.target.value as CarStatusT)}
                      className="rounded-md border border-black/15 px-2 py-1"
                    >
                      {(Object.keys(STATUS_LABEL) as CarStatusT[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleFeatured(c)}
                      aria-pressed={c.featured}
                      aria-label={`Destacar ${carTitle(c)}`}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${c.featured ? "bg-gold text-ink" : "bg-black/5 text-black/60"}`}
                    >
                      {c.featured ? "★ Destacado" : "☆ No"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/autos/${c.id}`} className="font-semibold text-accent underline">Editar</Link>
                    <button type="button" onClick={() => remove(c)} className="ml-4 text-black/50 underline hover:text-red-700">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-black/20 px-4 py-2 disabled:opacity-40">← Anterior</button>
          <span>Página {data.page} de {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-black/20 px-4 py-2 disabled:opacity-40">Siguiente →</button>
        </div>
      )}
    </>
  );
}
