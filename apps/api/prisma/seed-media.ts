import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { slugify } from "../src/common/slug.js";
import { naturalCompare } from "../src/media/photos.service.js";
import { placeholderImage } from "./placeholder-images.js";

export const SEED_DIR = resolve(process.cwd(), "../../seed/autos");

const IMAGE_FILE = /\.(jpe?g|png|webp|avif)$/i;

export interface SeedCarLike {
  brand: string;
  model: string;
  year: number;
  version?: string | null;
  color?: string | null;
}

export const seedSlug = (car: SeedCarLike) => slugify(`${car.brand} ${car.model} ${car.year}${car.version ? ` ${car.version}` : ""}`);

export async function readFolder(slug: string, sub: "fotos" | "360") {
  const dir = resolve(SEED_DIR, slug, sub);
  const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => IMAGE_FILE.test(n)).sort(naturalCompare);
  return Promise.all(names.map(async (name) => ({ name, buffer: await readFile(resolve(dir, name)) })));
}

/** Fotos de seed/autos/<slug>/fotos/ si existen; si no, imágenes de ejemplo generadas (marcadas como DEMO). */
export async function imagesFor(slug: string, car: SeedCarLike) {
  const real = await readFolder(slug, "fotos");
  if (real.length) return real;
  const title = `${car.brand} ${car.model} ${car.year}`;
  return Promise.all(
    [0, 1, 2, 3].map(async (view) => ({ name: `${view + 1}.jpg`, buffer: await placeholderImage({ title, color: car.color, view }) })),
  );
}

export interface ManifestPhoto {
  storageKey: string;
  width: number;
  height: number;
}
export type SeedManifest = Record<string, ManifestPhoto[]>;
