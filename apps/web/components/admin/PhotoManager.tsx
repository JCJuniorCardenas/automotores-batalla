"use client";

import { useRef, useState } from "react";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";
import type { PhotoDTO } from "@/lib/types";
import { CarImage } from "../CarImage";

export function PhotoManager({ carId, initial }: { carId: string; initial: PhotoDTO[] }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function run(fn: () => Promise<PhotoDTO[]>) {
    setBusy(true);
    setError(null);
    try {
      setPhotos(await fn());
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "No se pudo completar la acción");
    } finally {
      setBusy(false);
    }
  }

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append("files", f);
    void run(() => adminFetch<PhotoDTO[]>(`/admin/cars/${carId}/photos`, { method: "POST", body: form })).finally(() => {
      if (input.current) input.current.value = "";
    });
  };

  const move = (i: number, dir: -1 | 1) => {
    const ids = photos.map((p) => p.id);
    const j = i + dir;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void run(() => adminFetch<PhotoDTO[]>(`/admin/cars/${carId}/photos/reorder`, jsonInit("PATCH", { ids })));
  };

  return (
    <section className="mt-8 rounded-card bg-white p-5 shadow-[var(--shadow-card)]" aria-labelledby="fotos">
      <h2 id="fotos" className="text-xl font-bold">Fotos</h2>
      <p className="mt-1 text-sm text-black/60">JPG, PNG, WebP o AVIF, hasta 12 MB cada una. Se ordenan por nombre de archivo.</p>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        onChange={(e) => upload(e.target.files)}
        aria-label="Subir fotos"
        className="mt-3 block w-full text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
      />
      {busy && <p className="mt-2 text-sm text-black/60" role="status">Procesando…</p>}
      {error && <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {photos.length === 0 ? (
        <p className="mt-4 text-black/60">Todavía no hay fotos.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-md border border-black/10">
              <CarImage photo={p} fallbackAlt={p.alt} sizes="320px" className="aspect-[8/5] w-full object-cover" />
              <div className="space-y-2 p-3 text-sm">
                <p className="font-semibold">
                  #{i + 1} {p.isCover && <span className="ml-1 rounded-sm bg-gold px-2 py-0.5 text-xs">Portada</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Mover foto ${i + 1} antes`} className="rounded-sm border border-black/20 px-3 py-1 disabled:opacity-40">←</button>
                  <button disabled={busy || i === photos.length - 1} onClick={() => move(i, 1)} aria-label={`Mover foto ${i + 1} después`} className="rounded-sm border border-black/20 px-3 py-1 disabled:opacity-40">→</button>
                  {!p.isCover && (
                    <button disabled={busy} onClick={() => void run(() => adminFetch<PhotoDTO[]>(`/admin/cars/${carId}/photos/${p.id}`, jsonInit("PATCH", { isCover: true })))} className="rounded-sm border border-black/20 px-3 py-1">
                      Hacer portada
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => confirm("¿Eliminar esta foto?") && void run(() => adminFetch<PhotoDTO[]>(`/admin/cars/${carId}/photos/${p.id}`, { method: "DELETE" }))}
                    className="rounded-sm border border-red-300 px-3 py-1 text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
