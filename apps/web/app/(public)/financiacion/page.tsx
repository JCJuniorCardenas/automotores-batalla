import type { Metadata } from "next";
import { InstallmentSimulator } from "@/components/InstallmentSimulator";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSettings } from "@/lib/api";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Financiación",
  description: "Simulá la cuota de tu próximo auto: elegí anticipo y plazo. Simulación orientativa de Automotores Batalla.",
  alternates: { canonical: "/financiacion" },
};

export default async function FinancePage() {
  const { finance, contact } = await getSettings();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">Financiación</h1>
      <p className="mt-2 text-black/70">Calculá una cuota estimada y consultanos para ver las opciones reales.</p>
      <div className="mt-6">
        {finance.enabled ? (
          <InstallmentSimulator finance={finance} />
        ) : (
          <p className="rounded-card bg-white p-6 shadow-[var(--shadow-card)]">
            Consultanos por las opciones de financiación disponibles.
          </p>
        )}
      </div>
      <WhatsAppButton href={waLink(contact.whatsapp, "Hola! Quiero consultar por financiación.")} className="mt-6">
        Consultar financiación por WhatsApp
      </WhatsAppButton>
    </main>
  );
}
