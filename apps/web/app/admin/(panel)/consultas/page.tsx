"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { InquiryStatusT } from "@batalla/shared";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";
import { waLink } from "@/lib/whatsapp";

interface InquiryRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: InquiryStatusT;
  createdAt: string;
  car: { id: string; slug: string; brand: string; model: string; year: number } | null;
}
interface InquiryList {
  items: InquiryRow[];
  total: number;
  newCount: number;
  page: number;
  totalPages: number;
}

const STATUS_LABEL: Record<InquiryStatusT, string> = { NEW: "Nueva", CONTACTED: "Contactada", CLOSED: "Cerrada" };
const STATUS_STYLE: Record<InquiryStatusT, string> = {
  NEW: "bg-accent text-white",
  CONTACTED: "bg-gold text-ink",
  CLOSED: "bg-black/10 text-black/60",
};

const fmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

/** Teléfono → número para wa.me (asume Argentina si no trae código de país). */
function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.startsWith("54") ? digits : `54${digits}`;
}

export default function InquiriesPage() {
  const [filter, setFilter] = useState<"" | InquiryStatusT>("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<InquiryList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ page: String(page) });
    if (filter) qs.set("status", filter);
    adminFetch<InquiryList>(`/admin/inquiries?${qs}`)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Error al cargar"));
    return () => {
      alive = false;
    };
  }, [filter, page, tick]);

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      setTick((t) => t + 1);
    } catch (e) {
      alert(e instanceof AdminApiError ? e.message : "No se pudo completar la acción");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Consultas</h1>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {([["", "Todas"], ["NEW", "Nuevas"], ["CONTACTED", "Contactadas"], ["CLOSED", "Cerradas"]] as const).map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={filter === v}
            onClick={() => {
              setFilter(v);
              setPage(1);
            }}
            className={`rounded-sm px-4 py-1.5 text-sm font-semibold ${filter === v ? "bg-ink text-white" : "bg-white shadow-[var(--shadow-card)]"}`}
          >
            {l}
            {v === "NEW" && data && data.newCount > 0 ? ` (${data.newCount})` : ""}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {!data && !error && <p className="mt-6 text-black/60">Cargando…</p>}
      {data && data.items.length === 0 && <p className="mt-6 text-black/60">No hay consultas en esta vista.</p>}

      <ul className="mt-4 space-y-3">
        {data?.items.map((q) => (
          <li key={q.id} className="rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {q.name}
                  <span className={`ml-2 rounded-sm px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                </p>
                <p className="text-sm text-black/60">{fmt.format(new Date(q.createdAt))}</p>
              </div>
              <select
                aria-label={`Estado de la consulta de ${q.name}`}
                value={q.status}
                onChange={(e) => void act(() => adminFetch(`/admin/inquiries/${q.id}`, jsonInit("PATCH", { status: e.target.value })))}
                className="rounded-md border border-black/15 px-2 py-1 text-sm"
              >
                {(Object.keys(STATUS_LABEL) as InquiryStatusT[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            {q.car && (
              <p className="mt-2 text-sm">
                Sobre:{" "}
                <Link href={`/admin/autos/${q.car.id}`} className="font-semibold text-accent underline">
                  {q.car.brand} {q.car.model} {q.car.year}
                </Link>
              </p>
            )}
            <p className="mt-2 whitespace-pre-line">{q.message}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href={`tel:${q.phone}`} className="underline">{q.phone}</a>
              {q.email && <a href={`mailto:${q.email}`} className="underline">{q.email}</a>}
              <a
                href={waLink(waNumber(q.phone), `Hola ${q.name}! Te escribimos de Automotores Batalla por tu consulta.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#178a45] underline"
              >
                Responder por WhatsApp
              </a>
            </div>
          </li>
        ))}
      </ul>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-sm border border-black/20 px-4 py-2 disabled:opacity-40">← Anterior</button>
          <span>Página {data.page} de {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-sm border border-black/20 px-4 py-2 disabled:opacity-40">Siguiente →</button>
        </div>
      )}
    </>
  );
}
