"use client";

import { useState, type FormEvent } from "react";

interface Props {
  carId?: string;
  carLabel?: string;
}

const INPUT = "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2.5 font-normal focus-visible:outline-2 focus-visible:outline-accent";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string; fields: Record<string, string> };

export function InquiryForm({ carId, carLabel }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: d.get("name"),
          phone: d.get("phone"),
          email: d.get("email"),
          message: d.get("message"),
          website: d.get("website"),
          carId,
        }),
      });
      if (res.ok) {
        form.reset();
        setState({ kind: "sent" });
        return;
      }
      const body = (await res.json().catch(() => null)) as { message?: string; issues?: { path: string; message: string }[] } | null;
      setState({
        kind: "error",
        message:
          res.status === 429
            ? "Enviaste varias consultas seguidas. Esperá un minuto y probá de nuevo."
            : (body?.message ?? "No pudimos enviar tu consulta."),
        fields: Object.fromEntries((body?.issues ?? []).map((i) => [i.path, i.message])),
      });
    } catch {
      setState({ kind: "error", message: "No pudimos conectar. Revisá tu conexión o escribinos por WhatsApp.", fields: {} });
    }
  }

  if (state.kind === "sent") {
    return (
      <div role="status" className="rounded-card bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-lg font-bold">¡Gracias! Recibimos tu consulta.</p>
        <p className="mt-1 text-black/70">Te vamos a contactar a la brevedad.</p>
        <button type="button" onClick={() => setState({ kind: "idle" })} className="mt-4 text-sm font-semibold text-accent underline">
          Enviar otra consulta
        </button>
      </div>
    );
  }

  const fields = state.kind === "error" ? state.fields : {};
  const busy = state.kind === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]" aria-busy={busy}>
      {carLabel && <p className="text-sm text-black/70">Consulta sobre: <strong>{carLabel}</strong></p>}
      <label className="block text-sm font-semibold">
        Nombre
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={INPUT} />
        {fields.name && <span className="mt-1 block text-xs font-normal text-red-700">{fields.name}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Teléfono / WhatsApp
        <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" className={INPUT} />
        {fields.phone && <span className="mt-1 block text-xs font-normal text-red-700">{fields.phone}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Email <span className="font-normal text-black/50">(opcional)</span>
        <input name="email" type="email" autoComplete="email" className={INPUT} />
        {fields.email && <span className="mt-1 block text-xs font-normal text-red-700">{fields.email}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Mensaje
        <textarea name="message" required minLength={5} maxLength={2000} rows={4} defaultValue={carLabel ? `Hola! Me interesa el ${carLabel}. ` : ""} className={INPUT} />
        {fields.message && <span className="mt-1 block text-xs font-normal text-red-700">{fields.message}</span>}
      </label>
      {/* Honeypot: oculto para personas; los bots suelen completarlo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.kind === "error" && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {busy ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
