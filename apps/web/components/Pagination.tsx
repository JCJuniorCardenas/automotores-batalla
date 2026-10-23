import Link from "next/link";

interface Props {
  page: number;
  totalPages: number;
  basePath: string;
  params: URLSearchParams;
}

export function Pagination({ page, totalPages, basePath, params }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold";
  return (
    <nav aria-label="Paginación" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} className={`${btn} border border-black/20 hover:bg-black/5`}>← Anterior</Link>}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span aria-hidden="true">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${btn} ${p === page ? "bg-ink text-white" : "border border-black/20 hover:bg-black/5"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && <Link href={href(page + 1)} className={`${btn} border border-black/20 hover:bg-black/5`}>Siguiente →</Link>}
    </nav>
  );
}
