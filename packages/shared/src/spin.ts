import { z } from "zod";

export const SPIN_MIN_FRAMES = 12;
export const SPIN_MAX_FRAMES = 72;
/** Rango recomendado para una buena rotación sin pesar de más. */
export const SPIN_RECOMMENDED = { min: 24, max: 36 } as const;

export const spinReorderSchema = z.object({ ids: z.array(z.string().min(1)).min(SPIN_MIN_FRAMES).max(SPIN_MAX_FRAMES) });
