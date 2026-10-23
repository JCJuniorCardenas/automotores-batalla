import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const MIN_PASSWORD_LENGTH = 10;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual").max(200),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres`)
      .max(200)
      .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Combiná letras y números"),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña tiene que ser distinta de la actual",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
