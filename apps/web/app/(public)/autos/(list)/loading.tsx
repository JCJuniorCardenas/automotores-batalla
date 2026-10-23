export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8" aria-busy="true">
      <div className="h-9 w-64 animate-pulse rounded bg-black/10" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="h-16 animate-pulse rounded-card bg-black/10 lg:h-96" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-card bg-white shadow-[var(--shadow-card)]">
              <div className="aspect-[8/5] animate-pulse bg-black/10" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-black/10" />
                <div className="h-6 w-1/3 animate-pulse rounded bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
