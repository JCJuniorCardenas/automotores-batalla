"use client";

import { useState } from "react";
import type { PhotoDTO, SpinFrameDTO } from "@/lib/types";
import { Gallery } from "./Gallery";
import { Spin360Viewer } from "./Spin360Viewer";

type Tab = "photos" | "spin";

/** Fotos + 360°. Sin secuencia 360° se muestra solo la galería (sin pestañas). */
export function CarMedia({ photos, frames, title }: { photos: PhotoDTO[]; frames: SpinFrameDTO[]; title: string }) {
  const [tab, setTab] = useState<Tab>("photos");
  if (frames.length === 0) return <Gallery photos={photos} title={title} />;

  const btn = (id: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`rounded-sm px-4 py-2 text-sm font-semibold ${tab === id ? "bg-ink text-white" : "bg-white shadow-[var(--shadow-card)]"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div role="tablist" aria-label="Tipo de vista" className="mb-3 flex gap-2">
        {btn("photos", `Fotos (${photos.length})`)}
        {btn("spin", "Vista 360°")}
      </div>
      {tab === "photos" ? <Gallery photos={photos} title={title} /> : <Spin360Viewer frames={frames} title={title} />}
    </div>
  );
}
