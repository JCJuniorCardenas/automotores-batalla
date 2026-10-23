import type { Metadata } from "next";
import Link from "next/link";
import { CarCard } from "@/components/CarCard";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { ApiError, getCars, getFilters } from "@/lib/api";
import type { CarList } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

const TITLE = "Catálogo de autos 0km y usados";
const DESCRIPTION = "Mirá todos los autos 0km y usados de Automotores Batalla. Filtrá por marca, año, precio, kilometraje y más.";

/**
 * Catálogo sin filtros (y sus páginas) se indexa; cualquier combinación de filtros u orden se marca
 * noindex para no generar miles de URLs casi duplicadas.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const keys = Object.keys(sp).filter((k) => k !== "page");
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  if (keys.length > 0) {
    return { title: TITLE, description: DESCRIPTION, robots: { index: false, follow: true }, alternates: { canonical: "/autos" } };
  }
  return {
    title: page > 1 ? `${TITLE} - Página ${page}` : TITLE,
    description: DESCRIPTION,
    alternates: { canonical: page > 1 ? `/autos?page=${page}` : "/autos" },
  };
}

function toParams(sp: SearchParams) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) p.set(k, val);
  }
  return p;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = toParams(await searchParams);
  const [list, filters] = await Promise.all([
    getCars(params).catch((e): CarList | "invalid" => {
      if (e instanceof ApiError && e.status === 400) return "invalid";
      throw e; // lo atrapa app/(public)/error.tsx
    }),
    getFilters().catch(() => null), // sin filtros disponibles el catálogo igual funciona
  ]);

  const invalid = list === "invalid";
  const items = invalid ? [] : list.items;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Autos 0km y usados</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <FilterBar filters={filters} />
        </aside>
        <section aria-live="polite">
          {!invalid && (
            <p className="mb-4 text-sm text-black/60">
              {list.total === 1 ? "1 auto encontrado" : `${list.total} autos encontrados`}
            </p>
          )}
          {items.length === 0 ? (
            <div className="rounded-card bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <p className="text-lg font-semibold">
                {invalid ? "Alguno de los filtros no es válido" : "No encontramos autos con esos filtros"}
              </p>
              <p className="mt-1 text-black/60">Probá quitando algún filtro o consultanos por WhatsApp.</p>
              <Link href="/autos" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
                Limpiar filtros
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((c, i) => (
                <CarCard key={c.id} car={c} priority={i < 3} />
              ))}
            </div>
          )}
          {!invalid && <Pagination page={list.page} totalPages={list.totalPages} basePath="/autos" params={params} />}
        </section>
      </div>
    </main>
  );
}
