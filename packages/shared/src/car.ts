import { z } from "zod";
import { CarCondition, CarStatus, Currency, Fuel, Transmission } from "./enums.js";

const year = z.number().int().min(1950).max(new Date().getFullYear() + 1);

const carBase = z.object({
    brand: z.string().trim().min(1).max(60),
    model: z.string().trim().min(1).max(80),
    version: z.string().trim().max(120).nullish(),
    year,
    condition: CarCondition,
    priceAmount: z.number().positive().max(1_000_000_000),
    priceCurrency: Currency,
    mileageKm: z.number().int().min(0).max(2_000_000).nullish(),
    fuel: Fuel,
    transmission: Transmission,
    bodyType: z.string().trim().max(40).nullish(),
    color: z.string().trim().max(40).nullish(),
    doors: z.number().int().min(2).max(6).nullish(),
    engine: z.string().trim().max(60).nullish(),
    description: z.string().trim().max(5000),
    status: CarStatus,
    featured: z.boolean(),
    onOffer: z.boolean(),
    offerPrice: z.number().positive().nullish(),
});

export const carInputSchema = carBase
  .extend({
    description: carBase.shape.description.default(""),
    status: carBase.shape.status.default("AVAILABLE"),
    featured: carBase.shape.featured.default(false),
    onOffer: carBase.shape.onOffer.default(false),
  })
  .refine((c) => !c.onOffer || (c.offerPrice != null && c.offerPrice < c.priceAmount), {
    path: ["offerPrice"],
    message: "El precio de oferta debe ser menor al precio",
  })
  .refine((c) => c.condition === "USED" || !c.mileageKm, {
    path: ["mileageKm"],
    message: "Un 0km no puede tener kilometraje",
  });
export type CarInput = z.infer<typeof carInputSchema>;

export const carUpdateSchema = carBase.partial();

export const carSort = z.enum(["recent", "price_asc", "price_desc", "year_desc", "km_asc"]);

const num = z.coerce.number();
export const carQuerySchema = z.object({
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  q: z.string().trim().max(80).optional(),
  yearMin: num.int().optional(),
  yearMax: num.int().optional(),
  priceMin: num.optional(),
  priceMax: num.optional(),
  kmMax: num.int().optional(),
  fuel: Fuel.optional(),
  transmission: Transmission.optional(),
  condition: CarCondition.optional(),
  currency: Currency.optional(),
  featured: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sort: carSort.default("recent"),
  page: num.int().min(1).default(1),
  pageSize: num.int().min(1).max(48).default(12),
});
export type CarQuery = z.infer<typeof carQuerySchema>;

export const carStatusSchema = z.object({ status: CarStatus });
export const carFeaturedSchema = z.object({ featured: z.boolean() });

export const photoReorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });
export const photoUpdateSchema = z
  .object({ alt: z.string().trim().max(200).optional(), isCover: z.boolean().optional() })
  .refine((v) => v.alt !== undefined || v.isCover !== undefined, { message: "Nada para actualizar" });
