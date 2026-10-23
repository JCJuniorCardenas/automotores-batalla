// Arranque del servicio único de Render: migraciones -> seed opcional -> API (puerto interno) + web (puerto público).
// Si cualquiera de los dos procesos se cae, se corta todo para que Render reinicie el servicio.
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const apiDir = resolve(root, "apps/api");
const webDir = resolve(root, "apps/web");
const API_PORT = process.env.API_PORT ?? "3001";
const WEB_PORT = process.env.PORT ?? "3000";

function step(label, cmd, args, cwd, env = {}) {
  console.log(`[start] ${label}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status !== 0) {
    console.error(`[start] falló: ${label}`);
    process.exit(r.status ?? 1);
  }
}

step("migraciones", "pnpm", ["exec", "prisma", "migrate", "deploy"], apiDir);
if (process.env.RUN_SEED === "1") step("seed", "pnpm", ["exec", "tsx", "prisma/seed.ts"], apiDir);

const children = [
  spawn("node", ["dist/main.js"], { cwd: apiDir, stdio: "inherit", env: { ...process.env, PORT: API_PORT } }),
  spawn("pnpm", ["exec", "next", "start", "-p", WEB_PORT], { cwd: webDir, stdio: "inherit", env: process.env }),
];

const stop = (code) => {
  for (const c of children) c.kill("SIGTERM");
  setTimeout(() => process.exit(code), 3000).unref();
};
for (const c of children) {
  c.on("exit", (code) => {
    console.error(`[start] un proceso terminó (código ${code}); cerrando.`);
    stop(code ?? 1);
  });
}
process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));
