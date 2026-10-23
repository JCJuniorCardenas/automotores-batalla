"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";
import { FUEL_LABEL, STATUS_LABEL, TRANSMISSION_LABEL } from "@/lib/format";
import type { CarDTO } from "@/lib/types";

const INPUT = "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-normal";

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}
    </label>
  );
}

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));
const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

export function CarForm({ car }: { car?: CarDTO }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [onOffer, setOnOffer] = useState(car?.onOffer ?? false);
  const [condition, setCondition] = useState(car?.condition ?? "USED");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = {
      brand: str(d.get("brand")) ?? "",
      model: str(d.get("model")) ?? "",
      version: str(d.get("version")),
      year: num(d.get("year")),
      condition: d.get("condition"),
      priceAmount: num(d.get("priceAmount")),
      priceCurrency: d.get("priceCurrency"),
      mileageKm: condition === "ZERO_KM" ? null : num(d.get("mileageKm")),
      fuel: d.get("fuel"),
      transmission: d.get("transmission"),
      bodyType: str(d.get("bodyType")),
      color: str(d.get("color")),
      doors: num(d.get("doors")),
      engine: str(d.get("engine")),
      description: str(d.get("description")) ?? "",
      status: d.get("status"),
      featured: d.get("featured") === "on",
      onOffer,
      offerPrice: onOffer ? num(d.get("offerPrice")) : null,
    };
    setBusy(true);
    setError(null);
    setIssues({});
    try {
      if (car) {
        await adminFetch(`/admin/cars/${car.id}`, jsonInit("PUT", body));
        router.refresh();
        setBusy(false);
        setError(null);
        alert("Cambios guardados");
      } else {
        const created = await adminFetch<CarDTO>("/admin/cars", jsonInit("POST", body));
        router.replace(`/admin/autos/${created.id}`);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
        setIssues(Object.fromEntries(err.issues.map((i) => [i.path, i.message])));
      } else setError("No pudimos guardar. Revisá la conexión.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Marca *" error={issues.brand}><input name="brand" required defaultValue={car?.brand} className={INPUT} /></Field>
        <Field label="Modelo *" error={issues.model}><input name="model" required defaultValue={car?.model} className={INPUT} /></Field>
        <Field label="Versión" error={issues.version}><input name="version" defaultValue={car?.version ?? ""} className={INPUT} /></Field>
        <Field label="Año *" error={issues.year}><input name="year" type="number" required min={1950} defaultValue={car?.year ?? new Date().getFullYear()} className={INPUT} /></Field>
        <Field label="Tipo *">
          <select name="condition" value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} className={INPUT}>
            <option value="ZERO_KM">0km</option>
            <option value="USED">Usado</option>
          </select>
        </Field>
        <Field label="Kilometraje" error={issues.mileageKm}>
          <input name="mileageKm" type="number" min={0} disabled={condition === "ZERO_KM"} defaultValue={car?.mileageKm ?? ""} className={INPUT} />
        </Field>
        <Field label="Precio *" error={issues.priceAmount}><input name="priceAmount" type="number" step="any" required min={1} defaultValue={car?.priceAmount} className={INPUT} /></Field>
        <Field label="Moneda *">
          <select name="priceCurrency" defaultValue={car?.priceCurrency ?? "USD"} className={INPUT}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </Field>
        <Field label="Estado">
          <select name="status" defaultValue={car?.status ?? "AVAILABLE"} className={INPUT}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Combustible *">
          <select name="fuel" defaultValue={car?.fuel ?? "NAFTA"} className={INPUT}>
            {Object.entries(FUEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Transmisión *">
          <select name="transmission" defaultValue={car?.transmission ?? "MANUAL"} className={INPUT}>
            {Object.entries(TRANSMISSION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Motor"><input name="engine" defaultValue={car?.engine ?? ""} className={INPUT} /></Field>
        <Field label="Carrocería"><input name="bodyType" defaultValue={car?.bodyType ?? ""} placeholder="Sedán, SUV, Pick-up…" className={INPUT} /></Field>
        <Field label="Color"><input name="color" defaultValue={car?.color ?? ""} className={INPUT} /></Field>
        <Field label="Puertas"><input name="doors" type="number" min={2} max={6} defaultValue={car?.doors ?? ""} className={INPUT} /></Field>
      </div>

      <Field label="Descripción">
        <textarea name="description" rows={4} defaultValue={car?.description} className={INPUT} />
      </Field>

      <div className="flex flex-wrap items-start gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="featured" defaultChecked={car?.featured} className="h-4 w-4" /> Destacado en la home
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={onOffer} onChange={(e) => setOnOffer(e.target.checked)} className="h-4 w-4" /> En oferta
        </label>
        {onOffer && (
          <Field label="Precio de oferta" error={issues.offerPrice}>
            <input name="offerPrice" type="number" step="any" defaultValue={car?.offerPrice ?? ""} className={`${INPUT} w-48`} />
          </Field>
        )}
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button disabled={busy} className="rounded-sm bg-ink px-6 py-2.5 font-semibold text-white disabled:opacity-60">
          {busy ? "Guardando…" : car ? "Guardar cambios" : "Crear auto"}
        </button>
        <button type="button" onClick={() => router.push("/admin")} className="rounded-sm border border-black/20 px-6 py-2.5 font-semibold">
          Volver
        </button>
      </div>
      {!car && <p className="text-xs text-black/50">Las fotos se suben después de crear el auto.</p>}
    </form>
  );
}
