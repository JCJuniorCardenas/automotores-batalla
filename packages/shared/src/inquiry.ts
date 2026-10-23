import { z } from "zod";

export const InquiryStatus = z.enum(["NEW", "CONTACTED", "CLOSED"]);
export type InquiryStatusT = z.infer<typeof InquiryStatus>;

const phone = z
  .string()
  .trim()
  .min(6, "Ingresá un teléfono válido")
  .max(30)
  .regex(/^[0-9+()\-\s]+$/, "Usá solo números, espacios, + o guiones");

export const inquiryInputSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  phone,
  email: z.union([z.literal(""), z.string().trim().max(120).pipe(z.email("Email inválido"))]).optional(),
  message: z.string().trim().min(5, "Contanos en qué te podemos ayudar").max(2000),
  carId: z.string().trim().max(40).optional(),
  /** Honeypot: los humanos no lo ven ni lo completan. */
  website: z.string().max(200).optional(),
});
export type InquiryInput = z.infer<typeof inquiryInputSchema>;

export const inquiryStatusSchema = z.object({ status: InquiryStatus });

export const inquiryQuerySchema = z.object({
  status: InquiryStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type InquiryQuery = z.infer<typeof inquiryQuerySchema>;
