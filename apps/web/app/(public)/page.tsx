import type { Metadata } from "next";
import Link from "next/link";
import { CarCard } from "@/components/CarCard";
import { FullBleedImage } from "@/components/FullBleedImage";
import { InstagramIcon } from "@/components/icons";
import { ShowcasePanel } from "@/components/ShowcasePanel";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCars, getSettings } from "@/lib/api";
import type { CarDTO } from "@/lib/types";
import { SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: { absolute: "Automotores Batalla | Autos 0km y usados, permutas y consignaciones" },
  alternates: { canonical: "/" },
};

const SERVICES = [
  { title: "0km", text: "Unidades nuevas con entrega inmediata o a pedido." },
  { title: "Usados", text: "Autos seleccionados y revisados." },
  { title: "Permutas", text: "Tomamos tu usado como parte de pago." },
  { title: "Consignaciones", text: "Vendemos tu auto por vos." },
];

async function section(query: string): Promise<CarDTO[]> {
  try {
    return (await getCars(query)).items;
  } catch {
    return []; // la home nunca se rompe: si la API falla, se oculta la sección
  }
}

export default async function Home() {
  const [settings, featured, offers] = await Promise.all([
    getSettings(),
    section("featured=true&pageSize=6"),
    section("sort=recent&pageSize=48").then((items) => items.filter((c) => c.onOffer).slice(0, 3)),
  ]);

  // La foto del hero es de un destacado (otra toma distinta a la de su panel, si la hay).
  const heroPhoto = featured[0] ? (featured[0].photos[1] ?? featured[0].photos[0]) : undefined;

  return (
    <>
      <section className="relative flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-ink text-white">
        {heroPhoto && <FullBleedImage photo={heroPhoto} alt="" priority />}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:pb-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">0km · Usados · Permutas · Consignaciones</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-7xl">
            Tu próximo auto está en <span className="text-accent">Automotores Batalla</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Mirá el catálogo, simulá tu cuota y consultanos directo por WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/autos"
              className="rounded-full bg-accent px-7 py-3.5 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver catálogo
            </Link>
            <WhatsAppButton href={waGeneric(settings.contact.whatsapp)} className="px-7 py-3.5">
              Escribinos
            </WhatsAppButton>
          </div>
          {featured.length > 0 && (
            <a href="#destacados" className="mt-12 inline-flex flex-col items-center text-sm text-white/80 hover:text-white">
              <span>Destacados</span>
              <span aria-hidden="true" className="mt-1 text-2xl motion-safe:animate-bounce">↓</span>
            </a>
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <div id="destacados" aria-label="Autos destacados">
          {featured.slice(0, 3).map((c, i) => (
            <ShowcasePanel key={c.id} car={c} index={i} />
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="ofertas">
          <h2 id="ofertas" className="text-3xl font-bold">Ofertas</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 bg-ink py-16 text-center text-white" aria-labelledby="catalogo-cta">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="catalogo-cta" className="text-3xl font-extrabold sm:text-5xl">Mirá todo el stock</h2>
          <p className="mt-3 text-white/80">Filtrá por marca, año, precio, kilometraje y más.</p>
          <Link href="/autos" className="mt-7 inline-block rounded-full bg-accent px-8 py-3.5 font-semibold text-white hover:opacity-90">
            Ir al catálogo
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="servicios">
        <h2 id="servicios" className="text-3xl font-bold">Qué hacemos</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <li key={s.title} className="rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-bold text-accent">{s.title}</h3>
              <p className="mt-1 text-sm text-black/70">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Instagram: en la demo solo el enlace al perfil. El feed real llega en la Fase 3, con aprobación del dueño. */}
      <section className="mx-auto mt-12 max-w-6xl px-4" aria-labelledby="instagram">
        <div className="flex flex-col items-start gap-4 rounded-card bg-white p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="instagram" className="text-2xl font-bold">Seguinos en Instagram</h2>
            <p className="mt-1 text-black/70">Videos, entregas y novedades en {SITE.instagramHandle}.</p>
          </div>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-white hover:bg-black"
          >
            <InstagramIcon /> {SITE.instagramHandle}
          </a>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4" aria-labelledby="horarios">
        <h2 id="horarios" className="text-2xl font-bold">Horarios</h2>
        {settings.hours.lines.map((h) => (
          <p key={h} className="mt-2 text-black/80">{h}</p>
        ))}
      </section>
    </>
  );
}
