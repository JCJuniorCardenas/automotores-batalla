import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).default("");

export const contactSettingsSchema = z.object({
  /** Solo dígitos con código de país, sin +. Ej: 543772654605 */
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Usá solo números con código de país, sin + ni espacios (ej: 543772654605)"),
  phone: optionalText(30),
  email: z.union([z.literal(""), z.string().trim().max(120).pipe(z.email("Email inválido"))]).default(""),
  address: optionalText(160),
  city: optionalText(80),
  mapsUrl: z.union([z.literal(""), z.string().trim().max(500).pipe(z.url("Link inválido"))]).default(""),
});
export type ContactSettings = z.infer<typeof contactSettingsSchema>;

export const hoursSettingsSchema = z.object({
  lines: z.array(z.string().trim().min(1).max(120)).max(10),
});
export type HoursSettings = z.infer<typeof hoursSettingsSchema>;

export const financeSettingsSchema = z
  .object({
    enabled: z.boolean(),
    /** Anticipo sugerido al abrir el simulador, en % del precio. */
    defaultDownPaymentPct: z.number().min(0).max(90),
    /** Anticipo mínimo permitido, en % del precio. */
    minDownPaymentPct: z.number().min(0).max(90),
    /** Plazos disponibles, en meses. */
    terms: z.array(z.number().int().min(1).max(120)).min(1).max(8),
    /** TNA en %. */
    annualRatePct: z.number().min(0).max(500),
  })
  .refine((f) => f.defaultDownPaymentPct >= f.minDownPaymentPct, {
    path: ["defaultDownPaymentPct"],
    message: "El anticipo sugerido no puede ser menor al mínimo",
  });
export type FinanceSettings = z.infer<typeof financeSettingsSchema>;

export const SETTING_SCHEMAS = {
  contact: contactSettingsSchema,
  hours: hoursSettingsSchema,
  finance: financeSettingsSchema,
} as const;
export type SettingKey = keyof typeof SETTING_SCHEMAS;
export const isSettingKey = (k: string): k is SettingKey => k in SETTING_SCHEMAS;

export interface PublicSettings {
  contact: ContactSettings;
  hours: HoursSettings;
  finance: FinanceSettings;
}
