"use client";

import Image from "next/image";
import { photoLoader } from "@/lib/image";
import type { PhotoDTO } from "@/lib/types";

/** Foto que llena todo su contenedor (el padre debe ser `relative` y tener alto). */
export function FullBleedImage({
  photo,
  alt,
  priority,
  className = "",
}: {
  photo: PhotoDTO;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      loader={photoLoader}
      src={photo.urls.w1600}
      alt={alt}
      fill
      sizes="100vw"
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
