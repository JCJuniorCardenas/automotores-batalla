import { describe, expect, it } from "vitest";
import { inquiryInputSchema } from "./inquiry.js";
import { contactSettingsSchema } from "./settings.js";

describe("inquiryInputSchema", () => {
  const ok = { name: "Ana", phone: "+54 3772 654605", message: "Quiero más info" };
  it("acepta una consulta válida con email vacío", () => {
    expect(inquiryInputSchema.safeParse({ ...ok, email: "" }).success).toBe(true);
  });
  it("rechaza teléfonos con letras y mensajes muy cortos", () => {
    expect(inquiryInputSchema.safeParse({ ...ok, phone: "abc123" }).success).toBe(false);
    expect(inquiryInputSchema.safeParse({ ...ok, message: "hola" }).success).toBe(false);
  });
});

describe("contactSettingsSchema", () => {
  it("exige whatsapp solo con dígitos y código de país", () => {
    expect(contactSettingsSchema.safeParse({ whatsapp: "+54 3772" }).success).toBe(false);
    expect(contactSettingsSchema.parse({ whatsapp: "543772654605" }).address).toBe("");
  });
});
