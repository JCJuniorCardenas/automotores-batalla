import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSettings } from "@/lib/api";
import { formatWhatsapp, SITE } from "@/lib/site";
import { waGeneric } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por WhatsApp o dejá tu consulta. Horarios y datos de contacto de Automotores Batalla.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage() {
  const { contact, hours } = await getSettings();
  const place = [contact.address, contact.city].filter(Boolean).join(", ");
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Contacto</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="datos" className="space-y-5">
          <h2 id="datos" className="sr-only">Datos de contacto</h2>
          <WhatsAppButton href={waGeneric(contact.whatsapp)}>WhatsApp {formatWhatsapp(contact.whatsapp)}</WhatsAppButton>
          <dl className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">Horarios</dt>
              {hours.lines.map((h) => (
                <dd key={h} className="font-medium">{h}</dd>
              ))}
            </div>
            {place && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-black/50">Dirección</dt>
                <dd className="font-medium">{place}</dd>
                {contact.mapsUrl && (
                  <dd>
                    <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent underline">
                      Ver en el mapa
                    </a>
                  </dd>
                )}
              </div>
            )}
            {contact.phone && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-black/50">Teléfono</dt>
                <dd className="font-medium">{contact.phone}</dd>
              </div>
            )}
            {contact.email && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-black/50">Email</dt>
                <dd className="font-medium"><a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a></dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">Instagram</dt>
              <dd className="font-medium">
                <a className="underline" href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">{SITE.instagramHandle}</a>
              </dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="form">
          <h2 id="form" className="mb-3 text-xl font-bold">Dejanos tu consulta</h2>
          <InquiryForm />
        </section>
      </div>
    </main>
  );
}
