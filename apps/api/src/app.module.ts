import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module.js";
import { CarsModule } from "./cars/cars.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { HealthController } from "./health/health.controller.js";
import { MediaModule } from "./media/media.module.js";
import { InquiriesModule } from "./inquiries/inquiries.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    MediaModule,
    CarsModule,
    SettingsModule,
    InquiriesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
