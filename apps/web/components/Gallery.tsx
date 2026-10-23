"use client";

import { useRef, useState } from "react";
import { CarImage } from "./CarImage";
import type { PhotoDTO } from "@/lib/types";

export function Gallery({ photos, title }: { photos: PhotoDTO[]; title: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[8/5] items-center justify-center rounded-card bg-black/5 text-black/50">
        Este auto todavía no tiene fotos
      </div>
    );
  }

  function goTo(i: number) {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div role="region" aria-roledescription="carrusel" aria-label={`Fotos de ${title}`}>
      <div className="relative">
        <div
          ref={scroller}
          tabIndex={0}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(index + 1);
            if (e.key === "ArrowLeft") goTo(index - 1);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-card [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((p, i) => (
            <div key={p.id} className="aspect-[8/5] w-full shrink-0 snap-center bg-black/5">
              <CarImage
                photo={p}
                fallbackAlt={`${title} - foto ${i + 1}`}
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority={i === 0}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-sm bg-white/90 shadow disabled:opacity-40 sm:block"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => goTo(index + 1)}
              disabled={index === photos.length - 1}
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-sm bg-white/90 shadow disabled:opacity-40 sm:block"
            >
              ›
            </button>
            <p className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-2.5 py-1 text-xs text-white" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <li key={p.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className={`block w-20 overflow-hidden rounded-md border-2 ${i === index ? "border-accent" : "border-transparent opacity-70"}`}
              >
                <CarImage photo={p} fallbackAlt="" sizes="80px" className="aspect-[8/5] w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
