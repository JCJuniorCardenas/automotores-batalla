"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminFetch, AdminApiError, jsonInit } from "@/lib/admin-api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/auth/login", jsonInit("POST", { email: data.get("email"), password: data.get("password") }));
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof AdminApiError && err.status === 429
          ? "Demasiados intentos. Esperá un minuto."
          : err instanceof AdminApiError
            ? err.message
            : "No pudimos conectar con el servidor",
      );
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Panel de Automotores Batalla</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-card bg-white p-6 shadow-[var(--shadow-card)]">
        <label className="block text-sm font-semibold">
          Email
          <input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Contraseña
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 font-normal" />
        </label>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={busy} className="w-full rounded-sm bg-ink px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
