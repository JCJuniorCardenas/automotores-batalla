"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpinFrameDTO } from "@/lib/types";

type Size = "w480" | "w800" | "w1280";

/** Elige la variante según el ancho real en pantalla, el DPR y el estado de la conexión. */
function pickSize(cssWidth: number): Size {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  const slow = nav.connection?.saveData || /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? "");
  const px = cssWidth * Math.min(window.devicePixelRatio || 1, 2);
  if (slow || px <= 520) return "w480";
  return px <= 900 ? "w800" : "w1280";
}

const nearestLoaded = (imgs: (HTMLImageElement | undefined)[], i: number) => {
  for (let d = 0; d < imgs.length; d++) {
    const a = imgs[(i + d) % imgs.length];
    if (a) return a;
    const b = imgs[(i - d + imgs.length) % imgs.length];
    if (b) return b;
  }
  return undefined;
};

export function Spin360Viewer({ frames, title }: { frames: SpinFrameDTO[]; title: string }) {
  const total = frames.length;
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | undefined)[]>([]);
  const drag = useRef<{ x: number; start: number } | null>(null);

  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [failed, setFailed] = useState(false);

  // En equipos con buena conexión y mouse se activa solo al ver el visor; en celulares, con un toque.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    const lean = nav.connection?.saveData || /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? "");
    if (lean || !window.matchMedia("(pointer: fine)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Precarga progresiva: primero cada 4º frame (ya se puede girar), después el resto.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const size = pickSize(wrapper.current?.clientWidth ?? 480);
    const first = frames.map((_, i) => i).filter((i) => i % 4 === 0);
    const rest = frames.map((_, i) => i).filter((i) => i % 4 !== 0);
    let done = 0;
    let firstPassLeft = first.length;

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return resolve();
          images.current[i] = img;
          done++;
          setLoaded(done);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frames[i]!.urls[size];
      });

    (async () => {
      await Promise.all(
        first.map((i) =>
          load(i).then(() => {
            if (--firstPassLeft === 0 && !cancelled) {
              if (done === 0) setFailed(true);
              else {
                setInteractive(true);
                if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAutoplay(true);
              }
            }
          }),
        ),
      );
      // El resto en tandas chicas para no competir con el resto de la página.
      for (let k = 0; k < rest.length && !cancelled; k += 4) await Promise.all(rest.slice(k, k + 4).map(load));
    })();

    return () => {
      cancelled = true;
    };
  }, [active, frames]);

  const draw = useCallback(() => {
    const c = canvas.current;
    const img = nearestLoaded(images.current, index);
    if (!c || !img) return;
    if (c.width !== img.naturalWidth) {
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
    }
    c.getContext("2d")?.drawImage(img, 0, 0);
  }, [index]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw, loaded, interactive]);

  useEffect(() => {
    if (!autoplay || !interactive) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 80);
    return () => clearInterval(id);
  }, [autoplay, interactive, total]);

  const wrap = (n: number) => ((n % total) + total) % total;

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: index };
    setAutoplay(false);
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const step = Math.max(6, e.currentTarget.clientWidth / total / 1.4);
    setIndex(wrap(drag.current.start - Math.round((e.clientX - drag.current.x) / step)));
  }
  const endDrag = () => {
    drag.current = null;
  };

  const poster = frames[0]!.urls.w800;
  const pct = Math.round((loaded / total) * 100);

  return (
    <div ref={wrapper} className="relative aspect-[8/5] select-none overflow-hidden rounded-card bg-black/5">
      {!interactive && (
        // eslint-disable-next-line @next/next/no-img-element -- poster liviano; el visor maneja su propia carga
        <img src={poster} alt={`${title} - vista inicial del 360°`} className="h-full w-full object-cover" />
      )}
      <canvas
        ref={canvas}
        role="img"
        aria-label={`Vista 360° de ${title}. Arrastrá o usá las flechas del teclado para girar.`}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            setAutoplay(false);
            setIndex((i) => wrap(i + 1));
          } else if (e.key === "ArrowLeft") {
            setAutoplay(false);
            setIndex((i) => wrap(i - 1));
          }
        }}
        style={{ touchAction: "pan-y" }}
        className={`absolute inset-0 h-full w-full cursor-grab object-cover active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent ${interactive ? "" : "invisible"}`}
      />

      {!active && !failed && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"
        >
          <span className="rounded-full bg-white px-5 py-3 font-semibold text-ink shadow">↻ Ver en 360°</span>
        </button>
      )}
      {active && !interactive && !failed && (
        <div role="status" className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-sm text-white">
          Cargando 360°… {pct}%
        </div>
      )}
      {failed && (
        <p role="alert" className="absolute inset-x-0 bottom-0 bg-red-700 px-3 py-2 text-center text-sm text-white">
          No pudimos cargar el 360°. Mirá las fotos.
        </p>
      )}
      {interactive && (
        <>
          <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            Arrastrá para girar
          </p>
          {loaded < total && (
            <p className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white" aria-hidden="true">
              Mejorando… {pct}%
            </p>
          )}
          <button
            type="button"
            onClick={() => setAutoplay((a) => !a)}
            aria-pressed={autoplay}
            className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow"
          >
            {autoplay ? "⏸ Pausar giro" : "▶ Girar solo"}
          </button>
        </>
      )}
    </div>
  );
}
