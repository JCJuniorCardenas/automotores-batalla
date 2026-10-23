"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MIN_PASSWORD_LENGTH } from "@batalla/shared";
import { AdminApiError, adminFetch, jsonInit } from "@/lib/admin-api";

const INPUT = "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-normal";

type Result = { kind: "ok" } | { kind: "error"; message: string; fields: Record<string, string> } | null;

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    adminFetch<{ email: string }>("/auth/me")
      .then((u) => setEmail(u.email))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    if (d.get("newPassword") !== d.get("confirm")) {
      setResult({ kind: "error", message: "Las contraseñas nuevas no coinciden.", fields: { confirm: "No coincide" } });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      await adminFetch("/auth/change-password", jsonInit("POST", { currentPassword: d.get("currentPassword"), newPassword: d.get("newPassword") }));
      form.reset();
      setResult({ kind: "ok" });
    } catch (err) {
      setResult(
        err instanceof AdminApiError
          ? {
              kind: "error",
              message: err.status === 429 ? "Demasiados intentos. Esperá un minuto." : err.message,
              fields: Object.fromEntries(err.issues.map((i) => [i.path, i.message])),
            }
          : { kind: "error", message: "No se pudo cambiar la contraseña", fields: {} },
      );
    } finally {
      setBusy(false);
    }
  }

  const fields = result?.kind === "error" ? result.fields : {};
  const field = (name: string, label: string, hint?: string) => (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} type="password" required autoComplete={name === "currentPassword" ? "current-password" : "new-password"} className={INPUT} />
      {hint && <span className="mt-1 block text-xs font-normal text-black/50">{hint}</span>}
      {fields[name] && <span className="mt-1 block text-xs font-normal text-red-700">{fields[name]}</span>}
    </label>
  );

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold uppercase">Cuenta</h1>
      {email && <p className="mb-4 text-black/70">Sesión iniciada como <strong>{email}</strong></p>}
      <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-card bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-bold uppercase">Cambiar contraseña</h2>
        {field("currentPassword", "Contraseña actual")}
        {field("newPassword", "Contraseña nueva", `Al menos ${MIN_PASSWORD_LENGTH} caracteres, con letras y números.`)}
        {field("confirm", "Repetí la contraseña nueva")}
        {result?.kind === "ok" && (
          <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Listo, tu contraseña fue cambiada.</p>
        )}
        {result?.kind === "error" && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.message}</p>
        )}
        <button disabled={busy} className="btn btn-dark disabled:opacity-60">
          {busy ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </>
  );
}
