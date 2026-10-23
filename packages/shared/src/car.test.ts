import { describe, expect, it } from "vitest";
import { carInputSchema, carQuerySchema, carUpdateSchema } from "./car.js";

const base = {
  brand: "Fiat",
  model: "Cronos",
  year: 2025,
  condition: "ZERO_KM",
  priceAmount: 1000,
  priceCurrency: "USD",
  fuel: "NAFTA",
  transmission: "MANUAL",
};

describe("carInputSchema", () => {
  it("aplica defaults", () => {
    const r = carInputSchema.parse(base);
    expect(r.status).toBe("AVAILABLE");
    expect(r.featured).toBe(false);
  });

  it("rechaza oferta mayor o igual al precio", () => {
    expect(carInputSchema.safeParse({ ...base, onOffer: true, offerPrice: 1000 }).success).toBe(false);
    expect(carInputSchema.safeParse({ ...base, onOffer: true, offerPrice: 900 }).success).toBe(true);
  });

  it("rechaza 0km con kilometraje", () => {
    expect(carInputSchema.safeParse({ ...base, mileageKm: 500 }).success).toBe(false);
  });
});

describe("carUpdateSchema", () => {
  it("no completa defaults en actualizaciones parciales", () => {
    expect(carUpdateSchema.parse({ featured: true })).toEqual({ featured: true });
  });
});

describe("carQuerySchema", () => {
  it("convierte strings de la URL", () => {
    const q = carQuerySchema.parse({ yearMin: "2020", page: "2", featured: "true" });
    expect(q).toMatchObject({ yearMin: 2020, page: 2, featured: true, sort: "recent", pageSize: 12 });
  });
});
