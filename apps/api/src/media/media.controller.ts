import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { photoReorderSchema, photoUpdateSchema } from "@batalla/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { photoUrls } from "./image-urls.js";
import { PhotosService } from "./photos.service.js";

export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

type PhotoRow = Awaited<ReturnType<PhotosService["list"]>>[number];
const present = (photos: PhotoRow[]) => photos.map((p) => ({ ...p, urls: photoUrls(p.storageKey) }));

@Controller("admin/cars/:carId/photos")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class MediaController {
  constructor(private readonly photos: PhotosService) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files", MAX_FILES, { limits: { fileSize: MAX_FILE_BYTES } }))
  async upload(@Param("carId") carId: string, @UploadedFiles() files: Express.Multer.File[] = []) {
    const added = await this.photos.add(
      carId,
      files.map((f) => ({ name: f.originalname, buffer: f.buffer })),
    );
    return present(added);
  }

  @Patch("reorder")
  async reorder(@Param("carId") carId: string, @Body(new ZodPipe(photoReorderSchema)) body: { ids: string[] }) {
    return present(await this.photos.reorder(carId, body.ids));
  }

  @Patch(":photoId")
  async update(
    @Param("carId") carId: string,
    @Param("photoId") photoId: string,
    @Body(new ZodPipe(photoUpdateSchema)) body: { alt?: string; isCover?: boolean },
  ) {
    return present(await this.photos.update(carId, photoId, body));
  }

  @Delete(":photoId")
  async remove(@Param("carId") carId: string, @Param("photoId") photoId: string) {
    return present(await this.photos.remove(carId, photoId));
  }
}
