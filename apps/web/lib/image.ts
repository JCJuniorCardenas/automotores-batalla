import type { ImageLoaderProps } from "next/image";

const SIZES = [480, 960, 1600] as const;

/**
 * Las imágenes ya vienen optimizadas en 3 variantes WebP (-480/-960/-1600).
 * Elegimos la más cercana por ancho solicitado, sin pasar por el optimizador de Next.
 */
export function photoLoader({ src, width }: ImageLoaderProps) {
  const size = SIZES.find((s) => s >= width) ?? SIZES[SIZES.length - 1];
  return src.replace(/-(480|960|1600)\.webp$/, `-${size}.webp`);
}
