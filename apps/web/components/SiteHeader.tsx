import Link from "next/link";
import { getSettings } from "@/lib/api";
import { SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "./icons";

const NAV = [
  { href: "/autos", label: "Autos", always: true },
  { href: "/nosotros", label: "Nosotros", always: false },
  { href: "/contacto", label: "Contacto", always: true },
];

export async function SiteHeader() {
  const { contact } = await getSettings();
  return (
    <header className="sticky top-0 z-30 bg-ink text-[var(--color-brand-cream)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* Logo provisorio: reemplazar por el archivo real del cliente */}
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-sm bg-[var(--color-brand-cream)] font-display text-2xl font-extrabold leading-none text-accent">B</span>
          <span className="font-display text-xl font-bold uppercase leading-none tracking-wide">
            <span className="hidden sm:inline">Automotores </span>
            <span className="text-accent">Batalla</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${n.always ? "" : "hidden md:block"} px-2 py-2 font-display text-lg font-semibold uppercase tracking-wide hover:text-gold`}
            >
              {n.label}
            </Link>
          ))}
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${SITE.instagramHandle}`}
            className="p-2 hover:text-gold"
          >
            <InstagramIcon />
          </a>
          <a
            href={waGeneric(contact.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribinos por WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#178a45] px-3 py-2 text-white hover:bg-[#126f37]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden font-display text-base font-bold uppercase tracking-wide sm:inline">WhatsApp</span>
          </a>
        </nav>
      </div>
      <div className="flag-stripe" aria-hidden="true" />
    </header>
  );
}
