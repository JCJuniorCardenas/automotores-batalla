import Link from "next/link";
import { getSettings } from "@/lib/api";
import { formatWhatsapp, SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";

export async function SiteFooter() {
  const { contact, hours } = await getSettings();
  const place = [contact.address, contact.city].filter(Boolean).join(", ");
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{SITE.name}</p>
          <p className="mt-2 text-sm">Autos 0km y usados. Permutas y consignaciones.</p>
          <p className="mt-3 flex gap-4 text-sm">
            <Link href="/nosotros" className="underline">Nosotros</Link>
            <Link href="/financiacion" className="underline">Financiación</Link>
            <Link href="/contacto" className="underline">Contacto</Link>
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Horarios</p>
          {hours.lines.map((h) => (
            <p key={h} className="mt-2">{h}</p>
          ))}
          {place && <p className="mt-2">{place}</p>}
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Contacto</p>
          <p className="mt-2">
            <a className="underline" href={waGeneric(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
              WhatsApp {formatWhatsapp(contact.whatsapp)}
            </a>
          </p>
          {contact.phone && <p className="mt-2">Tel. {contact.phone}</p>}
          {contact.email && (
            <p className="mt-2">
              <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          )}
          <p className="mt-2">
            <a className="underline" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
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
