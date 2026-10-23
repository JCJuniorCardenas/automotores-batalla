import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { resolve } from "node:path";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
