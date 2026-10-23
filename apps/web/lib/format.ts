import type { CarConditionT, CarStatusT, CurrencyT, FuelT, TransmissionT } from "@batalla/shared";

export function formatPrice(amount: number, currency: CurrencyT) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/ /g, " ");
}

export const formatKm = (km: number) => `${new Intl.NumberFormat("es-AR").format(km)} km`;

export const FUEL_LABEL: Record<FuelT, string> = {
  NAFTA: "Nafta",
  DIESEL: "Diésel",
  GNC: "GNC",
  HIBRIDO: "Híbrido",
  ELECTRICO: "Eléctrico",
};
export const TRANSMISSION_LABEL: Record<TransmissionT, string> = { MANUAL: "Manual", AUTOMATICA: "Automática" };
export const CONDITION_LABEL: Record<CarConditionT, string> = { ZERO_KM: "0km", USED: "Usado" };
export const STATUS_LABEL: Record<CarStatusT, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  SOLD: "Vendido",
};

/** "Mercedes-Benz GLA" + versión "GLA 200" → "Mercedes-Benz GLA 200" (sin repetir el modelo). */
export function carTitle(c: { brand: string; model: string; version?: string | null }) {
  const version = c.version?.toLowerCase().startsWith(c.model.toLowerCase() + " ") ? c.version.slice(c.model.length + 1) : c.version;
  return [c.brand, c.model, version].filter(Boolean).join(" ");
}
