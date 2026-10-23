"use client";

import { DEFAULT_SETTINGS } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">No pudimos cargar esta página</h1>
      <p className="mt-2 text-black/70">Puede ser un problema momentáneo. Probá de nuevo o escribinos por WhatsApp.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-sm bg-ink px-5 py-2.5 font-semibold text-white">
          Reintentar
        </button>
        <a href={waGeneric(DEFAULT_SETTINGS.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-black/20 px-5 py-2.5 font-semibold">
          Ir a WhatsApp
        </a>
      </div>
    </main>
  );
}
