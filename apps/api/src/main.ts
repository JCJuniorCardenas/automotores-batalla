import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { resolve } from "node:path";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Detrás de un proxy (Next/Railway/Render) la IP real viene en X-Forwarded-For. TRUST_PROXY=<saltos|true>
  // hace que el rate limiting cuente por visitante y no por la IP del proxy. Sin definir: no se confía en nadie.
  const trust = process.env.TRUST_PROXY;
  if (trust) app.set("trust proxy", trust === "true" ? true : Number.isNaN(Number(trust)) ? trust : Number(trust));
  // Las imágenes se sirven a otro origen (web), por eso CORP cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.setGlobalPrefix("api", { exclude: ["health"] });
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(","), credentials: true });
  if (process.env.STORAGE_DRIVER !== "r2") {
    // Storage local: archivos con clave única (uuid), cacheables para siempre.
    app.useStaticAssets(resolve(process.env.UPLOAD_DIR ?? "uploads"), {
      prefix: "/media/",
      maxAge: "365d",
      immutable: true,
    });
  }
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}
void bootstrap();
