import Link from "next/link";
import { carTitle, CONDITION_LABEL, formatKm, formatPrice, FUEL_LABEL, STATUS_LABEL, TRANSMISSION_LABEL } from "@/lib/format";
import type { CarDTO } from "@/lib/types";
import { CarImage } from "./CarImage";

export function CarCard({ car, priority = false }: { car: CarDTO; priority?: boolean }) {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0];
  const title = carTitle(car);
  const price = car.onOffer && car.offerPrice ? car.offerPrice : car.priceAmount;
  return (
    <Link
      href={`/autos/${car.slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[8/5] overflow-hidden bg-black/5">
        <CarImage
          photo={cover}
          fallbackAlt={`${title} ${car.year}`}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
        <div className="absolute left-2 top-2 flex gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-ink px-2.5 py-1 text-white">{CONDITION_LABEL[car.condition]}</span>
          {car.onOffer && <span className="rounded-full bg-accent px-2.5 py-1 text-white">Oferta</span>}
          {car.status === "RESERVED" && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-ink">{STATUS_LABEL[car.status]}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        <p className="text-sm text-black/60">
          {car.year}
          {car.mileageKm != null && ` · ${formatKm(car.mileageKm)}`} · {FUEL_LABEL[car.fuel]} · {TRANSMISSION_LABEL[car.transmission]}
        </p>
        <div className="mt-auto pt-2">
          {car.onOffer && car.offerPrice && (
            <span className="mr-2 text-sm text-black/50 line-through">{formatPrice(car.priceAmount, car.priceCurrency)}</span>
          )}
          <span className="text-xl font-bold">{formatPrice(price, car.priceCurrency)}</span>
        </div>
      </div>
    </Link>
  );
}
