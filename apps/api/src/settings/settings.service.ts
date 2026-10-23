import { Injectable, NotFoundException } from "@nestjs/common";
import { SETTING_SCHEMAS, isSettingKey, type PublicSettings, type SettingKey } from "@batalla/shared";
import { PrismaService } from "../prisma/prisma.service.js";

/** Valores por defecto: WhatsApp y horarios confirmados; el resto queda vacío hasta que el cliente lo cargue. */
export function defaults(env: NodeJS.ProcessEnv = process.env): PublicSettings {
  return {
    contact: {
      whatsapp: env.DEFAULT_WHATSAPP || "543772654605",
      phone: env.BUSINESS_PHONE ?? "",
      email: env.BUSINESS_EMAIL ?? "",
      address: env.BUSINESS_ADDRESS ?? "",
      city: env.BUSINESS_CITY ?? "",
      mapsUrl: "",
    },
    hours: { lines: ["Lunes a viernes: 8:30 a 12:30 y 16:30 a 20:30"] },
    // VALORES DE EJEMPLO para la demo: las condiciones reales de financiación las define el cliente.
    finance: { enabled: true, defaultDownPaymentPct: 40, minDownPaymentPct: 30, terms: [12, 24, 36, 48], annualRatePct: 50 },
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<PublicSettings> {
    const rows = await this.prisma.setting.findMany();
    const result = defaults();
    for (const row of rows) {
      if (!isSettingKey(row.key)) continue;
      // Si el valor guardado no valida (cambió el esquema), se usa el default.
      const parsed = SETTING_SCHEMAS[row.key].safeParse(row.value);
      if (parsed.success) (result as unknown as Record<string, unknown>)[row.key] = parsed.data;
    }
    return result;
  }

  async get<K extends SettingKey>(key: K): Promise<PublicSettings[K]> {
    if (!isSettingKey(key)) throw new NotFoundException({ code: "SETTING_NOT_FOUND", message: "Configuración inexistente" });
    return (await this.getAll())[key];
  }

  async set(key: SettingKey, value: unknown) {
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });
    return this.get(key);
  }
}
