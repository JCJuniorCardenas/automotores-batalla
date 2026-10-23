import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarMedia } from "@/components/CarMedia";
import { InstagramIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { InquiryForm } from "@/components/InquiryForm";
import { InstallmentSimulator } from "@/components/InstallmentSimulator";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCar, getSettings } from "@/lib/api";
import { carTitle, CONDITION_LABEL, formatKm, formatPrice, FUEL_LABEL, STATUS_LABEL, TRANSMISSION_LABEL } from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import type { CarDTO } from "@/lib/types";
import { waLinkForCar } from "@/lib/whatsapp";

type Props = { params: Promise<{ slug: string }> };

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE.url}${url}`);

function currentPrice(car: CarDTO) {
  return car.onOffer && car.offerPrice ? car.offerPrice : car.priceAmount;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCar(slug).catch(() => null);
  if (!car) return { title: "Auto no encontrado" };
  const title = `${carTitle(car)} ${car.year} - ${CONDITION_LABEL[car.condition]}`;
  const description = `${title}. ${formatPrice(currentPrice(car), car.priceCurrency)}${car.mileageKm != null ? ` · ${formatKm(car.mileageKm)}` : ""} · ${FUEL_LABEL[car.fuel]} · ${TRANSMISSION_LABEL[car.transmission]}. Consultá en Automotores Batalla.`;
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/autos/${car.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/autos/${car.slug}`,
      images: cover ? [{ url: absolute(cover.urls.w1600), width: cover.width, height: cover.height, alt: cover.alt }] : undefined,
    },
  };
}

export default async function CarPage({ params }: Props) {
  const { slug } = await params;
  const [car, settings] = await Promise.all([getCar(slug), getSettings()]);
  if (!car) notFound();

  const title = carTitle(car);
  const specs: [string, string | null][] = [
    ["Año", String(car.year)],
    ["Condición", CONDITION_LABEL[car.condition]],
    ["Kilometraje", car.mileageKm != null ? formatKm(car.mileageKm) : car.condition === "ZERO_KM" ? "0 km" : null],
    ["Combustible", FUEL_LABEL[car.fuel]],
    ["Transmisión", TRANSMISSION_LABEL[car.transmission]],
    ["Motor", car.engine],
    ["Carrocería", car.bodyType],
    ["Color", car.color],
    ["Puertas", car.doors ? String(car.doors) : null],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${title} ${car.year}`,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    itemCondition: car.condition === "ZERO_KM" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    fuelType: FUEL_LABEL[car.fuel],
    vehicleTransmission: TRANSMISSION_LABEL[car.transmission],
    ...(car.mileageKm != null && {
      mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileageKm, unitCode: "KMT" },
    }),
    color: car.color ?? undefined,
    image: car.photos.map((p) => absolute(p.urls.w1600)),
    url: `${SITE.url}/autos/${car.slug}`,
    offers: {
      "@type": "Offer",
      price: currentPrice(car),
      priceCurrency: car.priceCurrency,
      availability: car.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
      seller: { "@type": "AutoDealer", name: SITE.name, url: SITE.url },
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Autos", path: "/autos" }, { name: title, path: `/autos/${car.slug}` }])} />
      <nav aria-label="Migas de pan" className="mb-4 text-sm text-black/60">
        <Link href="/" className="hover:underline">Inicio</Link> / <Link href="/autos" className="hover:underline">Autos</Link> / <span aria-current="page">{title}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="max-lg:order-1 lg:col-start-1">
          <CarMedia photos={car.photos} frames={car.spin?.status === "READY" ? car.spin.frames : []} title={`${title} ${car.year}`} />
        </div>
        <div className="max-lg:order-3 lg:col-start-1">
          {car.description && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-black/80">{car.description}</p>
            </section>
          )}
          <section className="mt-8">
            <h2 className="text-xl font-bold">Datos técnicos</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specs
                .filter((s): s is [string, string] => s[1] != null)
                .map(([k, v]) => (
                  <div key={k} className="border-b border-black/10 pb-2">
                    <dt className="text-xs uppercase tracking-wide text-black/50">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </section>
          {settings.finance.enabled && car.status !== "SOLD" && (
            <div className="mt-8">
              <InstallmentSimulator finance={settings.finance} price={currentPrice(car)} currency={car.priceCurrency} />
            </div>
          )}
          <section className="mt-8" aria-labelledby="consulta">
            <h2 id="consulta" className="mb-3 text-xl font-bold">Enviar una consulta</h2>
            <InquiryForm carId={car.id} carLabel={`${title} ${car.year}`} />
          </section>
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start max-lg:order-2">
          <div className="rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
            <h1 className="text-2xl font-bold leading-snug">{title}</h1>
            <p className="text-black/60">{car.year}</p>
            {car.status !== "AVAILABLE" && (
              <p className="mt-2 inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold">{STATUS_LABEL[car.status]}</p>
            )}
            <div className="mt-4">
              {car.onOffer && car.offerPrice && (
                <p className="text-sm text-black/50 line-through">{formatPrice(car.priceAmount, car.priceCurrency)}</p>
              )}
              <p className="text-3xl font-extrabold">{formatPrice(currentPrice(car), car.priceCurrency)}</p>
              {car.onOffer && <p className="text-sm font-semibold text-accent">¡Precio de oferta!</p>}
            </div>
            <WhatsAppButton href={waLinkForCar(settings.contact.whatsapp, car)} className="mt-5 w-full">
              Consultar por WhatsApp
            </WhatsAppButton>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-black/20 px-5 py-3 text-sm font-semibold hover:bg-black/5"
            >
              <InstagramIcon /> Ver más en {SITE.instagramHandle}
            </a>
            <p className="mt-4 text-xs text-black/50">Precio sujeto a cambios y a confirmación en el local.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
