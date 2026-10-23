import Link from "next/link";
import { carTitle, CONDITION_LABEL, formatKm, formatPrice, FUEL_LABEL, STATUS_LABEL, TRANSMISSION_LABEL } from "@/lib/format";
import type { CarDTO } from "@/lib/types";
import { CarImage } from "./CarImage";

const CHIP = "px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-wider";

export function CarCard({ car, priority = false, large = false }: { car: CarDTO; priority?: boolean; large?: boolean }) {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0];
  const title = carTitle(car);
  const price = car.onOffer && car.offerPrice ? car.offerPrice : car.priceAmount;
  return (
    <Link
      href={`/autos/${car.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-card)] transition hover:shadow-[0_0_0_2px_var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className={`relative overflow-hidden bg-black/5 ${large ? "aspect-[16/10] lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-[8/5]"}`}>
        <CarImage
          photo={cover}
          fallbackAlt={`${title} ${car.year}`}
          sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          priority={priority}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-0 top-0 flex">
          <span className={`${CHIP} bg-ink text-[var(--color-brand-cream)]`}>{CONDITION_LABEL[car.condition]}</span>
          {car.onOffer && <span className={`${CHIP} bg-accent text-white`}>Oferta</span>}
          {car.status === "RESERVED" && <span className={`${CHIP} bg-gold text-ink`}>{STATUS_LABEL[car.status]}</span>}
        </div>
      </div>
      <div className={`flex flex-col gap-1 p-4 ${large ? "sm:p-5" : ""}`}>
        <h3 className={`font-semibold leading-tight ${large ? "text-3xl" : "text-2xl"}`}>{title}</h3>
        <p className="text-sm text-black/65">
          {car.year}
          {car.mileageKm != null && ` · ${formatKm(car.mileageKm)}`} · {FUEL_LABEL[car.fuel]} · {TRANSMISSION_LABEL[car.transmission]}
        </p>
        <div className="mt-2 flex items-baseline gap-3 border-t border-black/10 pt-3">
          <span className={`font-display font-bold leading-none ${large ? "text-5xl" : "text-4xl"}`}>{formatPrice(price, car.priceCurrency)}</span>
          {car.onOffer && car.offerPrice && (
            <span className="text-sm text-black/50 line-through">{formatPrice(car.priceAmount, car.priceCurrency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
