export const PHOTO_WIDTHS = [480, 960, 1600] as const;

export const SPIN_WIDTHS = [480, 800, 1280] as const;

export type PhotoUrls = Record<`w${(typeof PHOTO_WIDTHS)[number]}`, string>;

/** Base pública de las imágenes: MEDIA_BASE_URL (local: http://localhost:3001/media; R2: dominio del bucket). */
function base() {
  return (process.env.MEDIA_BASE_URL ?? process.env.S3_PUBLIC_BASE_URL ?? "/media").replace(/\/$/, "");
}

export function variantKey(storageKey: string, width: number) {
  return `${storageKey}-${width}.webp`;
}

export function photoUrls(storageKey: string): PhotoUrls {
  const b = base();
  return {
    w480: `${b}/${variantKey(storageKey, 480)}`,
    w960: `${b}/${variantKey(storageKey, 960)}`,
    w1600: `${b}/${variantKey(storageKey, 1600)}`,
  };
}

export type FrameUrls = Record<`w${(typeof SPIN_WIDTHS)[number]}`, string>;

export function frameUrls(storageKey: string): FrameUrls {
  const b = base();
  return {
    w480: `${b}/${variantKey(storageKey, 480)}`,
    w800: `${b}/${variantKey(storageKey, 800)}`,
    w1280: `${b}/${variantKey(storageKey, 1280)}`,
  };
}
