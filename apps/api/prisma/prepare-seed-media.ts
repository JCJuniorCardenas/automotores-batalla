import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { storePhoto } from "../src/media/image-processor.js";
import { PHOTO_WIDTHS } from "../src/media/image-urls.js";
import { createStorage } from "../src/media/storage.js";
import { imagesFor, seedSlug, type SeedManifest } from "./seed-media.js";
import { seedCars } from "./seed-data.js";

/**
 * Pre-genera las variantes WebP de las fotos del seed con claves FIJAS (seed/<slug>/<nn>) y deja un
 * manifest en el storage. Se corre al construir la imagen: así, en hosts con disco efímero (Render
 * gratis), las fotos viajan dentro de la imagen y el seed solo crea filas en la base, sin procesar nada.
 */
async function main() {
  const storage = createStorage();
  const manifest: SeedManifest = {};
  for (const car of seedCars) {
    const slug = seedSlug(car);
    const images = await imagesFor(slug, car);
    manifest[slug] = [];
    for (const [i, img] of images.entries()) {
      const key = `seed/${slug}/${String(i + 1).padStart(2, "0")}`;
      manifest[slug].push(await storePhoto(storage, "seed", img.buffer, PHOTO_WIDTHS, 78, key));
    }
    console.log(`  ${slug}: ${images.length} fotos`);
  }
  const dir = resolve(process.env.UPLOAD_DIR ?? "uploads", "seed");
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, "manifest.json"), JSON.stringify(manifest));
  console.log(`Manifest del seed escrito en ${dir}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
