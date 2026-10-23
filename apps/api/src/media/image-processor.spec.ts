import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvalidImageError, allVariantKeys, storePhoto } from "./image-processor.js";
import { naturalCompare } from "./photos.service.js";
import { LocalStorage } from "./storage.js";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "batalla-"));
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const png = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#c00" } }).png().toBuffer();

describe("storePhoto", () => {
  it("genera las tres variantes WebP sin agrandar la imagen original", async () => {
    const storage = new LocalStorage(dir);
    const r = await storePhoto(storage, "cars/x/photos", await png(1000, 600));
    expect(r.width).toBe(1000);
    const files = await readdir(join(dir, "cars/x/photos"));
    expect(files).toHaveLength(3);
    expect(allVariantKeys(r.storageKey).every((k) => files.includes(k.split("/").pop()!))).toBe(true);
  });

  it("rechaza archivos que no son imágenes", async () => {
    const storage = new LocalStorage(dir);
    await expect(storePhoto(storage, "cars/y", Buffer.from("hola"))).rejects.toBeInstanceOf(InvalidImageError);
  });
});

describe("LocalStorage", () => {
  it("no permite salir de la carpeta raíz", async () => {
    await expect(new LocalStorage(dir).put("../afuera.txt", Buffer.from("x"))).rejects.toThrow();
  });
});

describe("naturalCompare", () => {
  it("ordena foto-2 antes que foto-10", () => {
    expect(["foto-10.jpg", "foto-2.jpg", "foto-1.jpg"].sort(naturalCompare)).toEqual([
      "foto-1.jpg",
      "foto-2.jpg",
      "foto-10.jpg",
    ]);
  });
});
