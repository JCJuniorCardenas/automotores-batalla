import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put, UseGuards } from "@nestjs/common";
import { SETTING_SCHEMAS, isSettingKey } from "@batalla/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { SettingsService } from "./settings.service.js";

@Controller("settings")
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("public")
  all() {
    return this.settings.getAll();
  }
}

@Controller("admin/settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  private key(raw: string) {
    if (!isSettingKey(raw)) throw new NotFoundException({ code: "SETTING_NOT_FOUND", message: "Configuración inexistente" });
    return raw;
  }

  @Get(":key")
  get(@Param("key") raw: string) {
    return this.settings.get(this.key(raw));
  }

  @Put(":key")
  async put(@Param("key") raw: string, @Body() body: unknown) {
    const key = this.key(raw);
    const parsed = SETTING_SCHEMAS[key].safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Datos inválidos",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    return this.settings.set(key, parsed.data);
  }
}
