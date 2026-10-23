// Descarga las fotos de ejemplo del seed (Wikimedia Commons, licencias libres) a
// seed/autos/<slug>/fotos/<archivo>, según seed/autos/credits.json.
// Las fotos no se versionan en git; este script las trae al construir la imagen o en una PC nueva.
//   node apps/api/scripts/fetch-seed-photos.mjs
// Si alguna no se puede bajar, avisa y sigue: el seed usa imágenes de respaldo para esos autos.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(here, "../../../seed/autos");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "BatallaDemoSeed/1.0 (demo de concesionaria; https://github.com/JCJuniorCardenas/automotores-batalla)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (res.ok) return res.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error(`HTTP falló: ${url}`);
}

async function getBuffer(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    await sleep(2000 * (i + 1));
  }
  throw new Error(`descarga falló: ${url}`);
}

async function thumbUrl(title) {
  const q = new URLSearchParams({
    format: "json",
    action: "query",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1600",
  });
  const j = await getJson(`${API}?${q}`);
  const page = Object.values(j.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.thumburl ?? null;
}

const credits = JSON.parse(await readFile(resolve(SEED_DIR, "credits.json"), "utf8"));
let ok = 0;
let skipped = 0;
let failed = 0;

for (const c of credits) {
  const dest = resolve(SEED_DIR, c.slug, "fotos", c.file);
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  try {
    const url = await thumbUrl(c.title);
    if (!url) throw new Error("sin URL");
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, await getBuffer(url));
    ok++;
    await sleep(300);
  } catch (e) {
    failed++;
    console.warn(`  ! ${c.slug}/${c.file} (${c.title}): ${e.message}`);
  }
}

console.log(`Fotos del seed: ${ok} descargadas, ${skipped} ya estaban, ${failed} fallaron.`);
