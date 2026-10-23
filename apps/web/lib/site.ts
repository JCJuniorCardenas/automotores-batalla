import type { PublicSettings } from "@batalla/shared";

export const SITE = {
  name: "Automotores Batalla",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  instagramUrl: process.env.INSTAGRAM_PROFILE_URL ?? "https://www.instagram.com/automotoresbatalla/",
  instagramHandle: "@automotoresbatalla",
} as const;

/**
 * Valores de respaldo si la API no responde. Los datos reales se editan desde el panel (Configuración).
 * Solo WhatsApp y horarios están confirmados por el cliente; el resto queda vacío.
 */
export const DEFAULT_SETTINGS: PublicSettings = {
  contact: { whatsapp: "543772654605", phone: "", email: "", address: "", city: "", mapsUrl: "" },
  hours: { lines: ["Lunes a viernes: 8:30 a 12:30 y 16:30 a 20:30"] },
  // Valores de EJEMPLO (demo); las condiciones reales las define el cliente desde el panel.
  finance: { enabled: true, defaultDownPaymentPct: 40, minDownPaymentPct: 30, terms: [12, 24, 36, 48], annualRatePct: 50 },
};

export const formatWhatsapp = (n: string) => `+${n}`;
