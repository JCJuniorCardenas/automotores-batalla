import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { slugify } from "../src/common/slug.js";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createStorage } from "../src/media/storage.js";
import { naturalCompare, PhotosService } from "../src/media/photos.service.js";
import { placeholderImage } from "./placeholder-images.js";
import { SpinService } from "../src/media/spin.service.js";
import { seedCars } from "./seed-data.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const storage = createStorage();
const photos = new PhotosService(prisma as never, storage);
const spin = new SpinService(prisma as never, storage);
const SEED_DIR = resolve(process.cwd(), "../../seed/autos");
/** SEED_REPLACE_MEDIA=1 vuelve a cargar fotos y 360° aunque el auto ya los tenga. */
const REPLACE_MEDIA = process.env.SEED_REPLACE_MEDIA === "1";

const IMAGE_FILE = /\.(jpe?g|png|webp|avif)$/i;

async function readFolder(slug: string, sub: "fotos" | "360") {
  const dir = resolve(SEED_DIR, slug, sub);
  const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => IMAGE_FILE.test(n)).sort(naturalCompare);
  return Promise.all(names.map(async (name) => ({ name, buffer: await readFile(resolve(dir, name)) })));
}

/** Fotos de seed/autos/<slug>/fotos/ si existen; si no, imágenes de ejemplo generadas (marcadas como DEMO). */
async function imagesFor(slug: string, car: { brand: string; model: string; year: number; color?: string | null }) {
  const real = await readFolder(slug, "fotos");
  if (real.length) return real;
  const title = `${car.brand} ${car.model} ${car.year}`;
  return Promise.all([0, 1, 2, 3].map(async (view) => ({ name: `${view + 1}.jpg`, buffer: await placeholderImage({ title, color: car.color, view }) })));
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD");
  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash, role: "ADMIN" },
    update: {},
  });

  for (const car of seedCars) {
    const slug = slugify(`${car.brand} ${car.model} ${car.year}${car.version ? ` ${car.version}` : ""}`);
    const data = { ...car, slug, publishedAt: new Date() };
    const saved = await prisma.car.upsert({ where: { slug }, create: data, update: data });

    if (REPLACE_MEDIA) {
      for (const p of await photos.list(saved.id)) await photos.remove(saved.id, p.id);
      if (await spin.get(saved.id)) await spin.remove(saved.id);
    }
    if ((await prisma.carPhoto.count({ where: { carId: saved.id } })) === 0) {
      await photos.add(saved.id, await imagesFor(slug, car));
    }
    // El 360° solo se carga si hay un set real en seed/autos/<slug>/360/ (no hay 360° de ejemplo).
    const frames = await readFolder(slug, "360");
    if (frames.length && !(await spin.get(saved.id))) await spin.replace(saved.id, frames);
  }
  console.log(`Seed OK: 1 admin, ${seedCars.length} autos de ejemplo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
