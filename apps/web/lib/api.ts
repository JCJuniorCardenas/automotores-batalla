import type { PublicSettings } from "@batalla/shared";
import { DEFAULT_SETTINGS } from "./site";
import type { CarDTO, CarFilters, CarList } from "./types";

const BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Fetch del lado servidor hacia la API (público, cacheado por poco tiempo). */
async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { next: { revalidate } });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Configuración pública (contacto y horarios). Nunca rompe el sitio: si la API falla usa los valores de respaldo. */
export async function getSettings(): Promise<PublicSettings> {
  try {
    return await get<PublicSettings>("/settings/public", 60);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const getCars = (query: URLSearchParams | string = "") => get<CarList>(`/cars?${query.toString()}`);
export const getCarSlugs = () => get<{ slug: string; updatedAt: string }[]>("/cars/slugs", 3600);
export const getFilters = () => get<CarFilters>("/cars/filters", 300);
export async function getCar(slug: string): Promise<CarDTO | null> {
  try {
    return await get<CarDTO>(`/cars/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
