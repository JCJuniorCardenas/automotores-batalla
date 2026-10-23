"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PublicSettings } from "@batalla/shared";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";

const INPUT = "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-normal";

type Result = { kind: "ok" } | { kind: "error"; message: string; fields: Record<string, string> } | null;

function useSave(key: "contact" | "hours" | "finance") {
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  async function save(body: unknown) {
    setBusy(true);
    setResult(null);
    try {
      await adminFetch(`/admin/settings/${key}`, jsonInit("PUT", body));
      setResult({ kind: "ok" });
    } catch (e) {
      setResult(
        e instanceof AdminApiError
          ? { kind: "error", message: e.status === 403 ? "Solo un administrador puede cambiar la configuración." : e.message, fields: Object.fromEntries(e.issues.map((i) => [i.path, i.message])) }
          : { kind: "error", message: "No se pudo guardar", fields: {} },
      );
    } finally {
      setBusy(false);
    }
  }
  return { result, busy, save };
}

function Feedback({ result }: { result: Result }) {
  if (!result) return null;
  return result.kind === "ok" ? (
    <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Guardado. El sitio se actualiza en hasta 1 minuto.</p>
  ) : (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.message}</p>
  );
}

function ContactForm({ initial }: { initial: PublicSettings["contact"] }) {
  const { result, busy, save } = useSave("contact");
  const fields = result?.kind === "error" ? result.fields : {};
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    void save(d);
  };
  const field = (name: keyof typeof initial, label: string, hint?: string) => (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} defaultValue={initial[name]} className={INPUT} />
      {hint && <span className="mt-1 block text-xs font-normal text-black/50">{hint}</span>}
      {fields[name] && <span className="mt-1 block text-xs font-normal text-red-700">{fields[name]}</span>}
    </label>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-bold">Datos de contacto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("whatsapp", "WhatsApp *", "Con código de país, sin + ni espacios. Ej: 543772654605")}
        {field("phone", "Teléfono fijo")}
        {field("email", "Email")}
        {field("city", "Ciudad")}
        {field("address", "Dirección")}
        {field("mapsUrl", "Link de Google Maps")}
      </div>
      <Feedback result={result} />
      <button disabled={busy} className="rounded-full bg-ink px-6 py-2.5 font-semibold text-white disabled:opacity-60">
        {busy ? "Guardando…" : "Guardar contacto"}
      </button>
    </form>
  );
}

function HoursForm({ initial }: { initial: PublicSettings["hours"] }) {
  const { result, busy, save } = useSave("hours");
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = String(new FormData(e.currentTarget).get("lines") ?? "");
    void save({ lines: text.split("\n").map((l) => l.trim()).filter(Boolean) });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-bold">Horarios</h2>
      <label className="block text-sm font-semibold">
        Una línea por renglón
        <textarea name="lines" rows={4} defaultValue={initial.lines.join("\n")} className={INPUT} />
        <span className="mt-1 block text-xs font-normal text-black/50">Ej: «Lunes a viernes: 8:30 a 12:30 y 16:30 a 20:30» y «Sábados: …» (confirmar con el cliente).</span>
      </label>
      <Feedback result={result} />
      <button disabled={busy} className="rounded-full bg-ink px-6 py-2.5 font-semibold text-white disabled:opacity-60">
        {busy ? "Guardando…" : "Guardar horarios"}
      </button>
    </form>
  );
}

function FinanceForm({ initial }: { initial: PublicSettings["finance"] }) {
  const { result, busy, save } = useSave("finance");
  const fields = result?.kind === "error" ? result.fields : {};
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    void save({
      enabled: d.get("enabled") === "on",
      defaultDownPaymentPct: Number(d.get("defaultDownPaymentPct")),
      minDownPaymentPct: Number(d.get("minDownPaymentPct")),
      annualRatePct: Number(d.get("annualRatePct")),
      terms: String(d.get("terms") ?? "")
        .split(",")
        .map((t) => Number(t.trim()))
        .filter((t) => Number.isFinite(t) && t > 0),
    });
  };
  const num = (name: string, label: string, value: number, hint?: string) => (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} type="number" step="any" defaultValue={value} className={INPUT} />
      {hint && <span className="mt-1 block text-xs font-normal text-black/50">{hint}</span>}
      {fields[name] && <span className="mt-1 block text-xs font-normal text-red-700">{fields[name]}</span>}
    </label>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-bold">Simulador de cuotas</h2>
      <p className="rounded-md bg-gold/20 px-3 py-2 text-sm">
        Los valores cargados son de <strong>ejemplo</strong>: reemplazalos por las condiciones reales del cliente. En el sitio siempre se aclara que es una simulación orientativa.
      </p>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="enabled" defaultChecked={initial.enabled} className="h-4 w-4" /> Mostrar el simulador en el sitio
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {num("annualRatePct", "Tasa nominal anual (TNA, %)", initial.annualRatePct, "Se calcula con cuota fija (sistema francés).")}
        {num("defaultDownPaymentPct", "Anticipo sugerido (%)", initial.defaultDownPaymentPct)}
        {num("minDownPaymentPct", "Anticipo mínimo (%)", initial.minDownPaymentPct)}
        <label className="block text-sm font-semibold">
          Plazos en cuotas
          <input name="terms" defaultValue={initial.terms.join(", ")} className={INPUT} />
          <span className="mt-1 block text-xs font-normal text-black/50">Separados por coma. Ej: 12, 24, 36, 48</span>
          {fields.terms && <span className="mt-1 block text-xs font-normal text-red-700">{fields.terms}</span>}
        </label>
      </div>
      <Feedback result={result} />
      <button disabled={busy} className="rounded-full bg-ink px-6 py-2.5 font-semibold text-white disabled:opacity-60">
        {busy ? "Guardando…" : "Guardar simulador"}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch<PublicSettings["contact"]>("/admin/settings/contact"),
      adminFetch<PublicSettings["hours"]>("/admin/settings/hours"),
      adminFetch<PublicSettings["finance"]>("/admin/settings/finance"),
    ])
      .then(([contact, hours, finance]) => setSettings({ contact, hours, finance }))
      .catch((e) => setError(e instanceof AdminApiError && e.status === 403 ? "Solo un administrador puede ver la configuración." : "No pudimos cargar la configuración"));
  }, []);

  if (error) return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>;
  if (!settings) return <p className="text-black/60">Cargando…</p>;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Configuración</h1>
      <div className="space-y-6">
        <ContactForm initial={settings.contact} />
        <HoursForm initial={settings.hours} />
        <FinanceForm initial={settings.finance} />
      </div>
    </>
  );
}
