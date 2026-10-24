import { describe, expect, it } from "vitest";
import { buildInquiryText, buildSimulationText, waUrl } from "./whatsapp.js";

const car = { title: "Chevrolet Onix Premier 1.0 Turbo AT", year: 2022, url: "https://sitio.example/autos/onix" };

describe("buildInquiryText", () => {
  it("incluye nombre, auto, mensaje y teléfono", () => {
    const t = buildInquiryText({ name: " Ana ", phone: "3772 111222", message: "¿Sigue disponible?", car });
    expect(t).toContain("Hola! Soy Ana.");
    expect(t).toContain("Me interesa el Chevrolet Onix Premier 1.0 Turbo AT 2022: https://sitio.example/autos/onix");
    expect(t).toContain("¿Sigue disponible?");
    expect(t).toContain("Mi teléfono: 3772 111222");
    expect(t).not.toContain("email");
  });
  it("sin auto no menciona ningún auto y con email lo agrega", () => {
    const t = buildInquiryText({ name: "Ana", phone: "1", message: "Hola", email: "a@b.com" });
    expect(t).not.toContain("Me interesa");
    expect(t).toContain("Mi email: a@b.com");
  });
});

describe("buildSimulationText", () => {
  it("resume la simulación y nombra el auto", () => {
    const t = buildSimulationText({ car, downPayment: "US$ 5.920", downPct: 40, months: 24, installment: "US$ 623" });
    expect(t).toContain("Me interesa el Chevrolet Onix Premier 1.0 Turbo AT 2022");
    expect(t).toContain("anticipo de US$ 5.920 (40%) y 24 cuotas de US$ 623");
  });
});

describe("waUrl", () => {
  it("codifica el texto para la URL", () => {
    expect(waUrl("5491100000000", "Hola! ¿Qué tal?\nChau")).toBe(
      `https://wa.me/5491100000000?text=${encodeURIComponent("Hola! ¿Qué tal?\nChau")}`,
    );
  });
});
