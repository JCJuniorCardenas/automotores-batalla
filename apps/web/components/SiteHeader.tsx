import Link from "next/link";
import { getSettings } from "@/lib/api";
import { SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "./icons";

export async function SiteHeader() {
  const { contact } = await getSettings();
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          {/* Logo provisorio: reemplazar por el archivo real del cliente */}
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-lg text-accent">B</span>
          <span className="leading-tight">
            <span className="hidden sm:inline">Automotores </span>
            <span className="text-accent">Batalla</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/autos" className="rounded-md px-2 py-2 hover:bg-black/5">Autos</Link>
          <Link href="/financiacion" className="hidden rounded-md px-2 py-2 hover:bg-black/5 sm:block">Financiación</Link>
          <Link href="/nosotros" className="hidden rounded-md px-2 py-2 hover:bg-black/5 md:block">Nosotros</Link>
          <Link href="/contacto" className="rounded-md px-2 py-2 hover:bg-black/5">Contacto</Link>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${SITE.instagramHandle}`}
            className="rounded-md p-2 hover:bg-black/5"
          >
            <InstagramIcon />
          </a>
          <a
            href={waGeneric(contact.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribinos por WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#178a45] px-3 py-2 text-white hover:bg-[#126f37]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
