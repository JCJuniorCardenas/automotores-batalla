import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./auth.js";

describe("changePasswordSchema", () => {
  const ok = { currentPassword: "vieja-clave-1", newPassword: "Nueva-clave-2024" };
  it("acepta una contraseña nueva válida", () => {
    expect(changePasswordSchema.safeParse(ok).success).toBe(true);
  });
  it("exige largo mínimo y letras con números", () => {
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "corta1" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "soloLetrasLargas" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "12345678901" }).success).toBe(false);
  });
  it("rechaza repetir la actual", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "Misma-clave-1", newPassword: "Misma-clave-1" }).success).toBe(false);
  });
});
