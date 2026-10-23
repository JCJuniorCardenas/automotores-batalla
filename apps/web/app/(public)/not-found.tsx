import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">No encontramos lo que buscabas</h1>
      <p className="mt-2 text-black/70">Puede que el auto ya se haya vendido o que el link esté mal.</p>
      <Link href="/autos" className="mt-6 inline-block rounded-sm bg-ink px-5 py-2.5 font-semibold text-white">
        Ver el catálogo
      </Link>
    </main>
  );
}
