import type { Metadata } from "next";
import Link from "next/link";
import { InstagramIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSettings } from "@/lib/api";
import { SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conocé Automotores Batalla: concesionaria de autos 0km y usados, con permutas y consignaciones.",
  alternates: { canonical: "/nosotros" },
};

const SERVICES = [
  { title: "Autos 0km", text: "Unidades nuevas. Consultá disponibilidad, colores y versiones." },
  { title: "Autos usados", text: "Una selección de usados con fotos y datos claros en el catálogo." },
  { title: "Permutas", text: "Podés entregar tu usado como parte de pago." },
  { title: "Consignaciones", text: "Ofrecemos tu auto en nuestro local y en nuestras redes." },
];

/** Marca visible de contenido pendiente de confirmar con el cliente. Quitar al cargar el texto real. */
function Provisional({ note }: { note: string }) {
  return (
    <p className="mt-3 inline-block rounded-md border border-dashed border-gold bg-gold/15 px-3 py-1.5 text-xs font-semibold text-black/70">
      ⚠ Contenido provisorio: {note}
    </p>
  );
}

export default async function AboutPage() {
  const { contact, hours } = await getSettings();
  const place = [contact.address, contact.city].filter(Boolean).join(", ");
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Nosotros</h1>

      <section className="mt-6" aria-labelledby="quienes">
        <h2 id="quienes" className="text-xl font-bold">Quiénes somos</h2>
        <p className="mt-2 text-black/80">
          Somos <strong>Automotores Batalla</strong>, una concesionaria de autos 0km y usados. Trabajamos con permutas y consignaciones
          y atendemos todas tus consultas por WhatsApp y por Instagram.
        </p>
        <Provisional note="texto armado con los datos del perfil; el cliente debe aprobarlo o reemplazarlo." />
      </section>

      <section className="mt-10" aria-labelledby="servicios">
        <h2 id="servicios" className="text-xl font-bold">Qué hacemos</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <li key={s.title} className="rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-bold text-accent">{s.title}</h3>
              <p className="mt-1 text-sm text-black/70">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="historia">
        <h2 id="historia" className="text-xl font-bold">Nuestra historia</h2>
        <div className="mt-3 rounded-card border border-dashed border-black/20 bg-white/60 p-5 text-black/60">
          Acá va la historia de la concesionaria: cómo empezó, desde cuándo trabaja y qué la distingue.
        </div>
        <Provisional note="falta que el cliente cuente su historia y la trayectoria. No se inventaron datos." />
      </section>

      <section className="mt-10" aria-labelledby="equipo">
        <h2 id="equipo" className="text-xl font-bold">El equipo y el local</h2>
        <div className="mt-3 rounded-card border border-dashed border-black/20 bg-white/60 p-5 text-black/60">
          Fotos del local y del equipo (a pedir al cliente).
        </div>
        <Provisional note="pendiente de fotos reales." />
      </section>

      <section className="mt-10" aria-labelledby="visitanos">
        <h2 id="visitanos" className="text-xl font-bold">Visitanos</h2>
        <dl className="mt-3 space-y-3 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
          <div>
            <dt className="text-xs uppercase tracking-wide text-black/50">Horarios</dt>
            {hours.lines.map((h) => (
              <dd key={h} className="font-medium">{h}</dd>
            ))}
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-black/50">Dirección</dt>
            <dd className="font-medium">
              {place || <span className="text-black/50">A confirmar (se carga desde el panel).</span>}
              {contact.mapsUrl && (
                <>
                  {" "}
                  <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent underline">
                    Ver en el mapa
                  </a>
                </>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <WhatsAppButton href={waGeneric(contact.whatsapp)}>Escribinos por WhatsApp</WhatsAppButton>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-3 font-semibold hover:bg-black/5"
          >
            <InstagramIcon /> {SITE.instagramHandle}
          </a>
          <Link href="/autos" className="rounded-full bg-ink px-5 py-3 font-semibold text-white">Ver catálogo</Link>
        </div>
      </section>
    </main>
  );
}
