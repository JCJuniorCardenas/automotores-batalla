"use client";

import { useRef, useState } from "react";
import { SPIN_MAX_FRAMES, SPIN_MIN_FRAMES, SPIN_RECOMMENDED } from "@batalla/shared";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";
import type { SpinFrameDTO } from "@/lib/types";

interface Spin {
  frameCount: number;
  frames: SpinFrameDTO[];
}

export function SpinManager({ carId, initial }: { carId: string; initial: Spin | null }) {
  const [spin, setSpin] = useState<Spin | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function run<T>(fn: () => Promise<T>, apply: (r: T) => void) {
    setBusy(true);
    setError(null);
    try {
      apply(await fn());
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "No se pudo completar la acción");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    if (spin && !confirm("Esto reemplaza la secuencia 360° actual. ¿Continuar?")) {
      if (input.current) input.current.value = "";
      return;
    }
    const form = new FormData();
    for (const f of files) form.append("files", f);
    void run(() => adminFetch<Spin>(`/admin/cars/${carId}/spin`, { method: "POST", body: form }), setSpin);
  };

  const reverse = () =>
    spin &&
    run(
      () => adminFetch<Spin>(`/admin/cars/${carId}/spin/reorder`, jsonInit("PATCH", { ids: [...spin.frames].reverse().map((f) => f.id) })),
      setSpin,
    );

  const remove = () =>
    confirm("¿Eliminar el 360° de este auto? Se conservan las fotos.") &&
    run(() => adminFetch(`/admin/cars/${carId}/spin`, { method: "DELETE" }), () => setSpin(null));

  const count = spin?.frameCount ?? 0;
  const outOfRange = spin && (count < SPIN_RECOMMENDED.min || count > SPIN_RECOMMENDED.max);

  return (
    <section className="mt-8 rounded-card bg-white p-5 shadow-[var(--shadow-card)]" aria-labelledby="spin-title">
      <h2 id="spin-title" className="text-xl font-bold">Vista 360°</h2>
      <p className="mt-1 text-sm text-black/60">
        Subí todas las imágenes del giro juntas ({SPIN_RECOMMENDED.min} a {SPIN_RECOMMENDED.max} es lo ideal; mínimo {SPIN_MIN_FRAMES}, máximo {SPIN_MAX_FRAMES}). Se ordenan por nombre de archivo:
        <code className="mx-1 rounded bg-black/5 px-1">frame-01</code>,<code className="mx-1 rounded bg-black/5 px-1">frame-02</code>…
      </p>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        onChange={(e) => upload(e.target.files)}
        aria-label="Subir imágenes del 360°"
        className="mt-3 block w-full text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
      />
      {busy && <p role="status" className="mt-2 text-sm text-black/60">Procesando imágenes… puede tardar unos segundos.</p>}
      {error && <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {spin ? (
        <>
          <p className="mt-4 text-sm font-semibold">
            {count} imágenes cargadas
            {outOfRange && <span className="ml-2 font-normal text-black/60">(recomendado: {SPIN_RECOMMENDED.min} a {SPIN_RECOMMENDED.max})</span>}
          </p>
          <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-2">
            {spin.frames.map((f, i) => (
              <li key={f.id} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas del panel */}
                <img src={f.urls.w480} alt={`Frame ${i + 1}`} loading="lazy" className="h-14 w-20 rounded object-cover" />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <button type="button" disabled={busy} onClick={() => void reverse()} className="rounded-sm border border-black/20 px-4 py-1.5">
              ⇄ Invertir sentido del giro
            </button>
            <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-sm border border-red-300 px-4 py-1.5 text-red-700">
              Eliminar 360°
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 text-black/60">Este auto no tiene 360°: en el sitio se muestran solo las fotos.</p>
      )}
    </section>
  );
}
