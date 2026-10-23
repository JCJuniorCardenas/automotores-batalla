"use client";

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

function refreshSession() {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** fetch hacia la API del panel: renueva la sesión una vez si el access token venció. */
export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const run = () => fetch(`/api${path}`, { ...init, credentials: "same-origin" });
  let res = await run();
  if (res.status === 401 && !path.startsWith("/auth/") && (await refreshSession())) res = await run();
  if (res.status === 401 && !path.startsWith("/auth/")) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- navegación completa a propósito: limpia estado de la sesión
    window.location.href = "/admin/login";
    throw new AdminApiError(401, "Sesión vencida");
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { message?: string; issues?: AdminApiError["issues"] } | null;
  if (!res.ok) throw new AdminApiError(res.status, body?.message ?? `Error ${res.status}`, body?.issues);
  return body as T;
}

export const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
