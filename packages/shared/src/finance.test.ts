import { describe, expect, it } from "vitest";
import { monthlyInstallment, simulate } from "./finance.js";

describe("monthlyInstallment", () => {
  it("sin interés divide el monto en partes iguales", () => {
    expect(monthlyInstallment(12000, 0, 12)).toBe(1000);
  });
  it("coincide con la fórmula del sistema francés", () => {
    // 10000 a 12 meses, TNA 36% (3% mensual) -> cuota ≈ 1004.62
    expect(monthlyInstallment(10000, 36, 12)).toBeCloseTo(1004.62, 2);
  });
  it("devuelve 0 si no hay nada que financiar", () => {
    expect(monthlyInstallment(0, 50, 12)).toBe(0);
  });
});

describe("simulate", () => {
  it("descuenta el anticipo y limita el anticipo al precio", () => {
    const r = simulate(10000, 4000, 0, [6, 12]);
    expect(r.financed).toBe(6000);
    expect(r.rows.map((x) => x.installment)).toEqual([1000, 500]);
    expect(simulate(10000, 99999, 10, [6]).financed).toBe(0);
  });
});
