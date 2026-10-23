import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SpinService } from "./spin.service.js";
import { LocalStorage } from "./storage.js";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "batalla-spin-"));
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const png = () => sharp({ create: { width: 64, height: 40, channels: 3, background: "#369" } }).png().toBuffer();

function setup() {
  const create = vi.fn(async (args: unknown) => args);
  const prisma = {
    car: { findUnique: vi.fn(async () => ({ id: "c1" })) },
    spinSequence: {
      findUnique: vi.fn(async () => null),
      create,
      delete: vi.fn(),
    },
    spinFrame: { update: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  };
  return { prisma, create, service: new SpinService(prisma as never, new LocalStorage(dir)) };
}

describe("SpinService.replace", () => {
  it("rechaza menos de 12 imágenes", async () => {
    const { service } = setup();
    const files = Array.from({ length: 5 }, (_, i) => ({ name: `frame-${i}.png`, buffer: Buffer.from("x") }));
    await expect(service.replace("c1", files)).rejects.toMatchObject({ response: { code: "BAD_FRAME_COUNT" } });
  });

  it("ordena por nombre natural y numera las posiciones desde 0", async () => {
    const { service, create } = setup();
    const buf = await png();
    // desordenados a propósito: frame-10 debe ir después de frame-2
    const names = ["frame-10.png", "frame-2.png", ...Array.from({ length: 10 }, (_, i) => `frame-${i + 3 > 9 ? 11 + i : i + 3}.png`)];
    await service.replace("c1", names.map((name) => ({ name, buffer: buf })));
    const data = (create.mock.calls[0]![0] as { data: { frameCount: number; frames: { create: { position: number }[] } } }).data;
    expect(data.frameCount).toBe(12);
    expect(data.frames.create.map((f) => f.position)).toEqual(Array.from({ length: 12 }, (_, i) => i));
  });

  it("rechaza archivos que no son imágenes", async () => {
    const { service } = setup();
    const files = Array.from({ length: 12 }, (_, i) => ({ name: `f${i}.png`, buffer: Buffer.from("no soy imagen") }));
    await expect(service.replace("c1", files)).rejects.toMatchObject({ response: { code: "INVALID_IMAGE" } });
  });
});
