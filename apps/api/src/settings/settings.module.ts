import { Module } from "@nestjs/common";
import { AdminSettingsController, PublicSettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";

@Module({
  controllers: [PublicSettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
