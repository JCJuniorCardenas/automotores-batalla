import { carTitle } from "./format";
import { SITE } from "./site";
import type { CarDTO } from "./types";

export function waLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function waLinkForCar(number: string, car: Pick<CarDTO, "brand" | "model" | "version" | "year" | "slug">) {
  const url = `${SITE.url}/autos/${car.slug}`;
  return waLink(number, `Hola! Me interesa el ${carTitle(car)} ${car.year}: ${url}`);
}

export const waGeneric = (number: string) => waLink(number, "Hola! Quiero hacer una consulta.");
