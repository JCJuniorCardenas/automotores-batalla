"use client";

import { useState } from "react";
import type { CurrencyT, FinanceSettings } from "@batalla/shared";
import { simulate } from "@batalla/shared/finance";
import { buildSimulationText, waUrl, type WaCar } from "@batalla/shared/whatsapp";
import { formatPrice } from "@/lib/format";
import { WhatsAppIcon } from "./icons";

interface Props {
  finance: FinanceSettings;
  /** Precio vigente del auto (con oferta, si tiene) y su moneda. */
  price: number;
  currency: CurrencyT;
  /** WhatsApp del negocio (solo dígitos con código de país). */
  whatsapp: string;
  /** El auto que se está simulando: aparece nombrado en el mensaje de WhatsApp. */
  car: WaCar;
}

export function InstallmentSimulator({ finance, price, currency, whatsapp, car }: Props) {
  const [downPct, setDownPct] = useState(finance.defaultDownPaymentPct);
  const [months, setMonths] = useState(finance.terms[Math.min(1, finance.terms.length - 1)]!);

  const down = Math.round((price * downPct) / 100);
  const sim = simulate(price, down, finance.annualRatePct, finance.terms);
  const selected = sim.rows.find((r) => r.months === months) ?? sim.rows[0]!;

  // Lo que ve la persona en pantalla es lo que viaja en el mensaje.
  const waHref = waUrl(
    whatsapp,
    buildSimulationText({
      car,
      downPayment: formatPrice(down, currency),
      downPct,
      months: selected.months,
      installment: formatPrice(Math.round(selected.installment), currency),
    }),
  );

  return (
    <section aria-labelledby="sim-title" className="rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 id="sim-title" className="text-2xl font-bold">Simulá tu cuota</h2>

      <div className="mt-4">
        <label className="block text-sm font-semibold" htmlFor="down">
          Anticipo: {downPct}% · {formatPrice(down, currency)}
        </label>
        <input
          id="down"
          type="range"
          min={finance.minDownPaymentPct}
          max={90}
          step={5}
          value={downPct}
          onChange={(e) => setDownPct(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-brand-red)]"
        />
        <p className="text-xs text-black/50">Anticipo mínimo: {finance.minDownPaymentPct}%</p>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Plazo</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {finance.terms.map((t) => (
            <label key={t} className={`cursor-pointer rounded-sm px-4 py-2 text-sm font-semibold ${months === t ? "bg-ink text-white" : "border border-black/20"}`}>
              <input type="radio" name="term" value={t} checked={months === t} onChange={() => setMonths(t)} className="sr-only" />
              {t} cuotas
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 rounded-md bg-surface p-4" aria-live="polite">
        <p className="text-sm text-black/60">Cuota mensual estimada ({selected.months} cuotas)</p>
        <p className="font-display text-5xl font-bold leading-none">{formatPrice(Math.round(selected.installment), currency)}</p>
        <p className="mt-2 text-sm text-black/60">
          A financiar: {formatPrice(Math.round(sim.financed), currency)} · Total a pagar en cuotas: {formatPrice(Math.round(selected.total), currency)}
        </p>
      </div>

      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">Cuota estimada según el plazo</caption>
        <thead>
          <tr className="text-left text-xs uppercase text-black/50">
            <th className="py-1">Plazo</th>
            <th className="py-1 text-right">Cuota</th>
          </tr>
        </thead>
        <tbody>
          {sim.rows.map((r) => (
            <tr key={r.months} className="border-t border-black/5">
              <td className="py-1.5">{r.months} cuotas</td>
              <td className="py-1.5 text-right font-medium">{formatPrice(Math.round(r.installment), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn mt-5 w-full bg-[#178a45] text-white hover:bg-[#126f37]">
        <WhatsAppIcon /> Consultar esta cuota por WhatsApp
      </a>

      <p className="mt-4 rounded-md bg-gold/20 px-3 py-2 text-xs text-black/70">
        <strong>Simulación orientativa.</strong> No constituye una oferta ni incluye gastos, seguros o impuestos. Las condiciones reales (tasa, plazos y requisitos) se confirman con el vendedor.
      </p>
    </section>
  );
}
