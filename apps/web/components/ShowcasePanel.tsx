import Link from "next/link";
import { carTitle, CONDITION_LABEL, formatKm, formatPrice, FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/format";
import type { CarDTO } from "@/lib/types";
import { FullBleedImage } from "./FullBleedImage";

/** Un auto a pantalla casi completa: foto grande, datos y botón. Se recorre con scroll. */
export function ShowcasePanel({ car, index }: { car: CarDTO; index: number }) {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0];
  if (!cover) return null;
  const title = carTitle(car);
  const price = car.onOffer && car.offerPrice ? car.offerPrice : car.priceAmount;
  return (
    <section
      aria-label={`${title} ${car.year}`}
      className="relative flex min-h-[88svh] items-end overflow-hidden bg-ink text-white"
    >
      <div className="showcase-media absolute inset-0">
        <FullBleedImage photo={cover} alt={cover.alt || `${title} ${car.year}`} priority={index === 0} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-32 sm:pb-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">
          {CONDITION_LABEL[car.condition]}
          {car.onOffer && <span className="ml-3 rounded-full bg-accent px-2.5 py-0.5 text-xs text-white">Oferta</span>}
        </p>
        <h2 className="mt-2 text-4xl font-extrabold leading-tight sm:text-6xl">{title}</h2>
        <p className="mt-2 text-lg text-white/80">
          {car.year}
          {car.mileageKm != null && ` · ${formatKm(car.mileageKm)}`} · {FUEL_LABEL[car.fuel]} · {TRANSMISSION_LABEL[car.transmission]}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-3xl font-extrabold sm:text-4xl">
            {car.onOffer && car.offerPrice && (
              <span className="mr-3 text-lg font-normal text-white/60 line-through">{formatPrice(car.priceAmount, car.priceCurrency)}</span>
            )}
            {formatPrice(price, car.priceCurrency)}
          </p>
          <Link
            href={`/autos/${car.slug}`}
            className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Ver este auto
          </Link>
        </div>
      </div>
    </section>
  );
}
