/**
 * Cálculo orientativo de cuotas con sistema francés (cuota fija).
 * `annualRatePct` es la TNA en %, capitalizada mensualmente (tasa mensual = TNA / 12).
 * Es una SIMULACIÓN: no incluye gastos, seguros ni impuestos de una financiación real.
 */
export function monthlyInstallment(financed: number, annualRatePct: number, months: number): number {
  if (financed <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return financed / months;
  return (financed * r) / (1 - Math.pow(1 + r, -months));
}

export interface InstallmentRow {
  months: number;
  installment: number;
  total: number;
}

export function simulate(price: number, downPayment: number, annualRatePct: number, terms: number[]) {
  const down = Math.min(Math.max(downPayment, 0), price);
  const financed = price - down;
  const rows: InstallmentRow[] = terms.map((months) => {
    const installment = monthlyInstallment(financed, annualRatePct, months);
    return { months, installment, total: installment * months };
  });
  return { financed, downPayment: down, rows };
}
