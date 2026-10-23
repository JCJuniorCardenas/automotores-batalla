import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { SPIN_MAX_FRAMES, spinReorderSchema } from "@batalla/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { frameUrls } from "./image-urls.js";
import { MAX_FILE_BYTES } from "./media.controller.js";
import { SpinService } from "./spin.service.js";

type Seq = NonNullable<Awaited<ReturnType<SpinService["get"]>>>;
export const presentSpin = (s: Seq | null) =>
  s && { ...s, frames: s.frames.map((f) => ({ ...f, urls: frameUrls(f.storageKey) })) };

@Controller("admin/cars/:carId/spin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class SpinController {
  constructor(private readonly spin: SpinService) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files", SPIN_MAX_FRAMES, { limits: { fileSize: MAX_FILE_BYTES } }))
  async upload(@Param("carId") carId: string, @UploadedFiles() files: Express.Multer.File[] = []) {
    return presentSpin(await this.spin.replace(carId, files.map((f) => ({ name: f.originalname, buffer: f.buffer }))));
  }

  @Patch("reorder")
  async reorder(@Param("carId") carId: string, @Body(new ZodPipe(spinReorderSchema)) body: { ids: string[] }) {
    return presentSpin(await this.spin.reorder(carId, body.ids));
  }

  @Delete()
  @HttpCode(204)
  remove(@Param("carId") carId: string) {
    return this.spin.remove(carId);
  }
}
