import Link from "next/link";
import { getSettings } from "@/lib/api";
import { formatWhatsapp, SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";
import { StarIcon } from "./icons";

export async function SiteFooter() {
  const { contact, hours } = await getSettings();
  const place = [contact.address, contact.city].filter(Boolean).join(", ");
  const label = "font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold";
  return (
    <footer className="mt-20 bg-ink text-[var(--color-brand-cream)]/80">
      <div className="flag-stripe" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-display text-5xl font-extrabold uppercase leading-[0.9] text-[var(--color-brand-cream)] sm:text-6xl">
            Automotores
            <br />
            <span className="text-accent">Batalla</span>
          </p>
          <p className="mt-4 flex items-center gap-1 text-gold" aria-hidden="true">
            <StarIcon /> <StarIcon /> <StarIcon />
          </p>
          <p className="mt-3 max-w-xs text-sm">Autos 0km y usados. Permutas y consignaciones.</p>
        </div>
        <div className="text-sm">
          <p className={label}>Horarios</p>
          {hours.lines.map((h) => (
            <p key={h} className="mt-2">{h}</p>
          ))}
          {place && <p className="mt-2">{place}</p>}
          <p className={`${label} mt-6`}>Navegá</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/autos" className="underline-offset-4 hover:underline">Autos</Link>
            <Link href="/nosotros" className="underline-offset-4 hover:underline">Nosotros</Link>
            <Link href="/contacto" className="underline-offset-4 hover:underline">Contacto</Link>
          </p>
        </div>
        <div className="text-sm">
          <p className={label}>Escribinos</p>
          <p className="mt-2">
            <a className="underline-offset-4 hover:underline" href={waGeneric(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
              WhatsApp {formatWhatsapp(contact.whatsapp)}
            </a>
          </p>
          {contact.phone && <p className="mt-2">Tel. {contact.phone}</p>}
          {contact.email && (
            <p className="mt-2">
              <a className="underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          )}
          <p className="mt-2">
            <a className="underline-offset-4 hover:underline" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram {SITE.instagramHandle}
            </a>
          </p>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        Versión de demostración · autos, precios e imágenes de ejemplo ·{" "}
        <Link href="/creditos" className="underline">Créditos de las fotos</Link>
      </p>
    </footer>
  );
}
