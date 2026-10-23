"use client";

import Image from "next/image";
import { photoLoader } from "@/lib/image";
import type { PhotoDTO } from "@/lib/types";

interface Props {
  photo: PhotoDTO | undefined;
  fallbackAlt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function CarImage({ photo, fallbackAlt, sizes, priority, className }: Props) {
  if (!photo) {
    return (
      <div className={`flex items-center justify-center bg-black/5 text-sm text-black/50 ${className ?? ""}`}>
        Sin foto
      </div>
    );
  }
  return (
    <Image
      loader={photoLoader}
      src={photo.urls.w960}
      alt={photo.alt || fallbackAlt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
