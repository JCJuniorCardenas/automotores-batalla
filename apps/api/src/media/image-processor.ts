import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { PHOTO_WIDTHS, SPIN_WIDTHS, variantKey } from "./image-urls.js";
import type { StorageDriver } from "./storage.js";

export class InvalidImageError extends Error {}

const ALLOWED = new Set(["jpeg", "png", "webp", "avif"]);

export interface StoredImage {
  storageKey: string;
  width: number;
  height: number;
}

/**
 * Valida que el buffer sea una imagen real (no confía en el MIME), corrige la
 * orientación EXIF y guarda tres variantes WebP (480/960/1600 px de ancho).
 */
export async function storePhoto(
  storage: StorageDriver,
  folder: string,
  input: Buffer,
  widths: readonly number[] = PHOTO_WIDTHS,
  quality = 78,
  /** Clave fija (solo para el seed pre-generado); por defecto es `<folder>/<uuid>`. */
  fixedKey?: string,
): Promise<StoredImage> {
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new InvalidImageError("El archivo no es una imagen válida");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw new InvalidImageError("Formato no soportado (usar JPG, PNG, WebP o AVIF)");
  }

  const storageKey = fixedKey ?? `${folder}/${randomUUID()}`;
  const written: string[] = [];
  let largest = { width: 0, height: 0 };
  try {
    for (const w of widths) {
      const { data, info } = await sharp(input)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      const key = variantKey(storageKey, w);
      await storage.put(key, data, "image/webp");
      written.push(key);
      largest = { width: info.width, height: info.height };
    }
  } catch (e) {
    await storage.deleteMany(written).catch(() => undefined);
    throw e;
  }
  return { storageKey, ...largest };
}

export function allVariantKeys(storageKey: string, widths: readonly number[] = PHOTO_WIDTHS): string[] {
  return widths.map((w) => variantKey(storageKey, w));
}

/** Los frames del 360° usan anchos propios y menos calidad: son muchos y se ven en movimiento. */
export const storeSpinFrame = (storage: StorageDriver, folder: string, input: Buffer) =>
  storePhoto(storage, folder, input, SPIN_WIDTHS, 72);

export const spinVariantKeys = (storageKey: string) => allVariantKeys(storageKey, SPIN_WIDTHS);
