"use client";

import { useState, type FormEvent } from "react";
import { buildInquiryText, waUrl, type WaCar } from "@batalla/shared/whatsapp";
import { WhatsAppIcon } from "./icons";

interface Props {
  /** WhatsApp del negocio (solo dígitos con código de país). */
  whatsapp: string;
  /** Auto consultado: se guarda asociado a la consulta y se nombra en el mensaje de WhatsApp. */
  car?: WaCar & { id: string };
}

const INPUT = "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2.5 font-normal focus-visible:outline-2 focus-visible:outline-accent";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; href: string }
  | { kind: "error"; message: string; fields: Record<string, string> };

/**
 * Formulario de consulta: guarda la consulta en el panel y lleva a la persona al WhatsApp del negocio
 * con el mensaje ya armado. Si guardar falla (sin conexión, límite de intentos), igual abre WhatsApp:
 * la consulta real es la conversación; el registro en el panel es un extra.
 */
export function InquiryForm({ whatsapp, car }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const values = {
      name: String(d.get("name") ?? ""),
      phone: String(d.get("phone") ?? ""),
      email: String(d.get("email") ?? ""),
      message: String(d.get("message") ?? ""),
    };
    setState({ kind: "sending" });

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, website: d.get("website"), carId: car?.id }),
      });
      // Datos inválidos: se corrigen antes de seguir. Cualquier otro fallo no frena el WhatsApp.
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as { message?: string; issues?: { path: string; message: string }[] } | null;
        setState({
          kind: "error",
          message: body?.message ?? "Revisá los datos.",
          fields: Object.fromEntries((body?.issues ?? []).map((i) => [i.path, i.message])),
        });
        return;
      }
    } catch {
      // sin conexión con la API: seguimos igual hacia WhatsApp
    }

    const href = waUrl(whatsapp, buildInquiryText({ ...values, car }));
    form.reset();
    setState({ kind: "sent", href });
    window.location.assign(href);
  }

  if (state.kind === "sent") {
    return (
      <div role="status" className="rounded-card bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-2xl font-bold">Te llevamos a WhatsApp…</p>
        <p className="mt-1 text-black/70">Ya tenés el mensaje armado, solo tocá enviar. Tu consulta quedó registrada.</p>
        <a href={state.href} target="_blank" rel="noopener noreferrer" className="btn mt-4 bg-[#178a45] text-white hover:bg-[#126f37]">
          <WhatsAppIcon /> Abrir WhatsApp
        </a>
        <button type="button" onClick={() => setState({ kind: "idle" })} className="mt-4 block w-full text-sm font-semibold text-accent underline">
          Enviar otra consulta
        </button>
      </div>
    );
  }

  const fields = state.kind === "error" ? state.fields : {};
  const busy = state.kind === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]" aria-busy={busy}>
      {car && (
        <p className="text-sm text-black/70">
          Consulta sobre: <strong>{car.title} {car.year}</strong>
        </p>
      )}
      <label className="block text-sm font-semibold">
        Nombre
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={INPUT} />
        {fields.name && <span className="mt-1 block text-xs font-normal text-red-700">{fields.name}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Teléfono
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
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          placeholder={car ? "Ej: ¿Sigue disponible? ¿Aceptan permuta?" : "Contanos en qué te podemos ayudar"}
          className={INPUT}
        />
        {fields.message && <span className="mt-1 block text-xs font-normal text-red-700">{fields.message}</span>}
      </label>
      {/* Honeypot: oculto para personas; los bots suelen completarlo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.kind === "error" && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}
      <button disabled={busy} className="btn w-full bg-[#178a45] text-white hover:bg-[#126f37] disabled:opacity-60 sm:w-auto">
        <WhatsAppIcon />
        {busy ? "Enviando…" : "Enviar por WhatsApp"}
      </button>
      <p className="text-xs text-black/50">Al enviar se abre WhatsApp con tu mensaje listo para mandar.</p>
    </form>
  );
}
