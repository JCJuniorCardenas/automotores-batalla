import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

describe("slugify", () => {
  it("normaliza acentos, espacios y símbolos", () => {
    expect(slugify("Mercedes-Benz Clase C 2019")).toBe("mercedes-benz-clase-c-2019");
    expect(slugify("  Citroën  C3 ")).toBe("citroen-c3");
  });
});
