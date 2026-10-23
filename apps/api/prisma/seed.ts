import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PhotosService } from "../src/media/photos.service.js";
import { SpinService } from "../src/media/spin.service.js";
import { createStorage } from "../src/media/storage.js";
import { seedCars } from "./seed-data.js";
import { imagesFor, readFolder, seedSlug, type SeedManifest } from "./seed-media.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const storage = createStorage();
const photos = new PhotosService(prisma as never, storage);
const spin = new SpinService(prisma as never, storage);
/** SEED_REPLACE_MEDIA=1 vuelve a cargar fotos y 360° aunque el auto ya los tenga. */
const REPLACE_MEDIA = process.env.SEED_REPLACE_MEDIA === "1";

/** Manifest de fotos pre-generadas (ver prepare-seed-media.ts). Si no existe, se procesan al sembrar. */
async function loadManifest(): Promise<SeedManifest | null> {
  try {
    return JSON.parse(await readFile(resolve(process.env.UPLOAD_DIR ?? "uploads", "seed/manifest.json"), "utf8")) as SeedManifest;
  } catch {
    return null;
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD");
  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash, role: "ADMIN" },
    // Por defecto no se pisa la contraseña de un admin existente (la cambia desde el panel).
    // SEED_RESET_ADMIN_PASSWORD=1 la restablece a ADMIN_PASSWORD (por si se perdió el acceso).
    update: process.env.SEED_RESET_ADMIN_PASSWORD === "1" ? { passwordHash } : {},
  });

  const manifest = await loadManifest();

  for (const car of seedCars) {
    const slug = seedSlug(car);
    const data = { ...car, slug, publishedAt: new Date() };
    const saved = await prisma.car.upsert({ where: { slug }, create: data, update: data });
    const prebuilt = manifest?.[slug];

    if (REPLACE_MEDIA) {
      if (prebuilt) {
        // Los archivos pre-generados son compartidos: solo se reemplazan las filas, no se borran archivos.
        await prisma.carPhoto.deleteMany({ where: { carId: saved.id } });
      } else {
        for (const p of await photos.list(saved.id)) await photos.remove(saved.id, p.id);
      }
      if (await spin.get(saved.id)) await spin.remove(saved.id);
    }

    if ((await prisma.carPhoto.count({ where: { carId: saved.id } })) === 0) {
      if (prebuilt?.length) {
        await prisma.carPhoto.createMany({
          data: prebuilt.map((p, i) => ({
            carId: saved.id,
            storageKey: p.storageKey,
            width: p.width,
            height: p.height,
            position: i,
            isCover: i === 0,
            alt: `${car.brand} ${car.model} ${car.year} - foto ${i + 1}`,
          })),
        });
      } else {
        await photos.add(saved.id, await imagesFor(slug, car));
      }
    }

    // El 360° solo se carga si hay un set real en seed/autos/<slug>/360/ (no hay 360° de ejemplo).
    const frames = await readFolder(slug, "360");
    if (frames.length && !(await spin.get(saved.id))) await spin.replace(saved.id, frames);
  }
  console.log(`Seed OK: 1 admin, ${seedCars.length} autos de ejemplo${manifest ? " (fotos pre-generadas)" : ""}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
