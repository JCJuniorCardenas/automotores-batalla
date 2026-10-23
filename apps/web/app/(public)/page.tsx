import type { Metadata } from "next";
import Link from "next/link";
import { CarCard } from "@/components/CarCard";
import { CarImage } from "@/components/CarImage";
import { InstagramIcon, StarIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCars, getSettings } from "@/lib/api";
import { carTitle } from "@/lib/format";
import type { CarDTO } from "@/lib/types";
import { SITE } from "@/lib/site";
import { waGeneric, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: { absolute: "Automotores Batalla | Autos 0km y usados, permutas y consignaciones" },
  alternates: { canonical: "/" },
};

const SERVICES = [
  { n: "01", title: "0km", text: "Unidades nuevas. Consultá disponibilidad y entrega." },
  { n: "02", title: "Usados", text: "Una selección de autos con fotos y datos claros." },
  { n: "03", title: "Permutas", text: "Tu usado puede entrar como parte de pago." },
  { n: "04", title: "Consignaciones", text: "Ofrecemos tu auto por vos." },
];

const KICKER = "font-display text-base font-semibold uppercase tracking-[0.2em] text-accent";
const SECTION_TITLE = "font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl";

async function section(query: string): Promise<CarDTO[]> {
  try {
    return (await getCars(query)).items;
  } catch {
    return []; // la home nunca se rompe: si la API falla, se oculta la sección
  }
}

function Ticker() {
  const items = ["0km", "Usados", "Permutas", "Consignaciones"];
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
      {[...items, ...items].map((t, i) => (
        <span key={i} className="flex items-center gap-8 font-display text-2xl font-bold uppercase tracking-wider">
          {t}
          <StarIcon className="h-4 w-4 text-gold" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden bg-ink py-3 text-[var(--color-brand-cream)]" role="presentation">
      <div className="ticker-track">
        {row}
        {row}
      </div>
    </div>
  );
}

export default async function Home() {
  const [settings, featured, offers] = await Promise.all([
    getSettings(),
    section("featured=true&pageSize=6"),
    section("sort=recent&pageSize=48").then((items) => items.filter((c) => c.onOffer).slice(0, 3)),
  ]);

  const hero = featured[0];
  const heroPhoto = hero ? (hero.photos.find((p) => p.isCover) ?? hero.photos[0]) : undefined;
  const [big, ...smallOnes] = featured.slice(0, 3);
  const rest = featured.slice(3);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-20 lg:pt-14">
        <div>
          <p className={KICKER}>0km · Usados · Permutas · Consignaciones</p>
          <h1 className="mt-4 font-display text-[clamp(3.2rem,8.5vw,6.5rem)] font-extrabold uppercase leading-[0.86]">
            Tu próximo
            <br />
            auto está
            <br />
            en <span className="text-accent">Batalla</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-black/75">
            Mirá el stock, simulá tu cuota y escribinos directo por WhatsApp. Sin vueltas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/autos" className="btn btn-red">Ver los autos</Link>
            <WhatsAppButton href={waGeneric(settings.contact.whatsapp)}>Escribinos</WhatsAppButton>
          </div>
        </div>

        {hero && heroPhoto && (
          <Link href={`/autos/${hero.slug}`} className="group relative block lg:ml-6" aria-label={`Ver ${carTitle(hero)} ${hero.year}`}>
            <span aria-hidden="true" className="absolute -bottom-3 -right-3 h-full w-full bg-accent" />
            <span aria-hidden="true" className="absolute -left-3 -top-3 h-16 w-16 border-l-4 border-t-4 border-gold" />
            <div className="relative aspect-[4/3] overflow-hidden bg-ink">
              <CarImage
                photo={heroPhoto}
                fallbackAlt={`${carTitle(hero)} ${hero.year}`}
                sizes="(min-width: 1024px) 45vw, 100vw"
                priority
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute bottom-0 left-0 bg-ink px-4 py-2.5 text-[var(--color-brand-cream)]">
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold">Destacado</p>
                <p className="font-display text-2xl font-bold leading-tight">{carTitle(hero)}</p>
              </div>
            </div>
          </Link>
        )}
      </section>

      <Ticker />

      {big && (
        <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="destacados">
          <div className="flex items-end justify-between gap-4">
            <h2 id="destacados" className={SECTION_TITLE}>
              Destacados<span className="text-accent">.</span>
            </h2>
            <Link href="/autos" className="font-display text-lg font-semibold uppercase tracking-wide underline underline-offset-4 hover:text-accent">
              Ver todos →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.7fr_1fr] lg:grid-rows-2">
            <div className="lg:row-span-2">
              <CarCard car={big} large />
            </div>
            {smallOnes.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
          {rest.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          )}
        </section>
      )}

      {offers.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="ofertas">
          <h2 id="ofertas" className={SECTION_TITLE}>
            Ofertas<span className="text-accent">.</span>
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 grid lg:grid-cols-2" aria-labelledby="vender">
        <div className="bg-ink px-4 py-12 text-[var(--color-brand-cream)] sm:px-10 lg:px-16 lg:py-16">
          <p className="font-display text-base font-semibold uppercase tracking-[0.2em] text-gold">Permutas y consignaciones</p>
          <h2 id="vender" className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl">
            ¿Tenés un auto
            <br />
            para vender?
          </h2>
        </div>
        <div className="flex flex-col items-start justify-center gap-5 bg-accent px-4 py-12 text-white sm:px-10 lg:px-16">
          <p className="max-w-sm text-xl font-medium leading-snug">
            Pasanos los datos y unas fotos por WhatsApp y lo hablamos: permuta, consignación o venta.
          </p>
          <a
            href={waLink(settings.contact.whatsapp, "Hola! Quiero consultar por una permuta / consignación de mi auto.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-line text-white hover:bg-white hover:text-accent"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="servicios">
        <h2 id="servicios" className={SECTION_TITLE}>
          Qué hacemos<span className="text-accent">.</span>
        </h2>
        <ul className="mt-6 grid border-y-2 border-ink sm:grid-cols-2 lg:grid-cols-4 lg:divide-x-2 lg:divide-ink">
          {SERVICES.map((s) => (
            <li key={s.title} className="border-b border-black/15 p-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0">
              <span className="font-display text-5xl font-extrabold leading-none text-accent/90">{s.n}</span>
              <h3 className="mt-2 font-display text-3xl font-bold uppercase leading-none">{s.title}</h3>
              <p className="mt-2 text-sm text-black/70">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Instagram: en la demo solo el enlace al perfil. El feed real llega en la Fase 3, con aprobación del dueño. */}
      <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-4 md:grid-cols-2" aria-label="Instagram y horarios">
        <div className="border-2 border-ink p-6 sm:p-8">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none">Seguinos en Instagram</h2>
          <p className="mt-3 text-black/75">Videos, entregas y novedades en {SITE.instagramHandle}.</p>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-5">
            <InstagramIcon /> {SITE.instagramHandle}
          </a>
        </div>
        <div className="bg-ink p-6 text-[var(--color-brand-cream)] sm:p-8">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none">Horarios</h2>
          {settings.hours.lines.map((h) => (
            <p key={h} className="mt-3 font-display text-2xl font-semibold leading-snug">{h}</p>
          ))}
        </div>
      </section>
    </>
  );
}
