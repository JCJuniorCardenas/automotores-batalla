import type { MetadataRoute } from "next";
import { getCarSlugs } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/autos", priority: 0.9, changeFrequency: "daily" },
  { path: "/nosotros", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contacto", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Si la API no responde, el sitemap igual devuelve las páginas fijas.
  const cars = await getCarSlugs().catch(() => []);
  return [
    ...STATIC.map((p) => ({ url: absoluteUrl(p.path), priority: p.priority, changeFrequency: p.changeFrequency })),
    ...cars.map((c) => ({
      url: absoluteUrl(`/autos/${c.slug}`),
      lastModified: new Date(c.updatedAt),
      priority: 0.8,
      changeFrequency: "weekly" as const,
    })),
  ];
}
