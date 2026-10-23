import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const metadata: Metadata = {
  title: "Créditos de las fotos",
  robots: { index: false, follow: false },
};

interface Credit {
  slug: string;
  file: string;
  title: string;
  author: string;
  license: string;
  page: string;
}

/** Créditos de las fotos de ejemplo de la demo (generados al descargarlas; ver seed/autos/CREDITS.md). */
async function loadCredits(): Promise<Credit[]> {
  try {
    const raw = await readFile(resolve(process.cwd(), "../../seed/autos/credits.json"), "utf8");
    return JSON.parse(raw) as Credit[];
  } catch {
    return [];
  }
}

export default async function CreditsPage() {
  const credits = await loadCredits();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Créditos de las fotos</h1>
      <p className="mt-2 text-black/70">
        Las fotos de los autos de esta versión de demostración son de{" "}
        <a className="underline" href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>{" "}
        y se usan bajo sus licencias libres. Se reemplazan por fotos reales de Automotores Batalla.
      </p>
      {credits.length === 0 ? (
        <p className="mt-6 text-black/60">No hay créditos para mostrar.</p>
      ) : (
        <ul className="mt-6 space-y-2 text-sm">
          {credits.map((c) => (
            <li key={`${c.slug}-${c.file}`} className="rounded-md bg-white p-3 shadow-[var(--shadow-card)]">
              <a className="font-semibold underline" href={c.page} target="_blank" rel="noopener noreferrer">{c.title}</a>
              <span className="text-black/60"> · {c.author || "Autor en la página original"} · {c.license}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
