import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { allVariantKeys, InvalidImageError, storePhoto } from "./image-processor.js";
import type { StorageDriver } from "./storage.js";

export interface UploadedImage {
  name: string;
  buffer: Buffer;
}

export const naturalCompare = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });

/** Lógica de fotos de autos. Sin decoradores de Nest para poder usarla también desde el seed. */
export class PhotosService {
  constructor(
    private readonly prisma: Pick<PrismaService, "car" | "carPhoto" | "$transaction">,
    private readonly storage: StorageDriver,
  ) {}

  private async requireCar(carId: string) {
    const car = await this.prisma.car.findUnique({ where: { id: carId }, select: { id: true, brand: true, model: true, year: true } });
    if (!car) throw new NotFoundException({ code: "CAR_NOT_FOUND", message: "Auto no encontrado" });
    return car;
  }

  list(carId: string) {
    return this.prisma.carPhoto.findMany({ where: { carId }, orderBy: { position: "asc" } });
  }

  /** Agrega fotos al final, ordenadas por nombre de archivo (orden natural). */
  async add(carId: string, files: UploadedImage[]) {
    const car = await this.requireCar(carId);
    if (!files.length) throw new BadRequestException({ code: "NO_FILES", message: "No se enviaron archivos" });

    const sorted = [...files].sort((a, b) => naturalCompare(a.name, b.name));
    const stored = [];
    try {
      for (const f of sorted) stored.push(await storePhoto(this.storage, `cars/${carId}/photos`, f.buffer));
    } catch (e) {
      await this.storage.deleteMany(stored.flatMap((s) => allVariantKeys(s.storageKey))).catch(() => undefined);
      if (e instanceof InvalidImageError) throw new BadRequestException({ code: "INVALID_IMAGE", message: e.message });
      throw e;
    }

    const existing = await this.list(carId);
    const last = existing.at(-1)?.position ?? -1;
    const hasCover = existing.some((p) => p.isCover);
    await this.prisma.$transaction(
      stored.map((s, i) =>
        this.prisma.carPhoto.create({
          data: {
            carId,
            ...s,
            position: last + 1 + i,
            isCover: !hasCover && i === 0,
            alt: `${car.brand} ${car.model} ${car.year} - foto ${existing.length + i + 1}`,
          },
        }),
      ),
    );
    return this.list(carId);
  }

  async reorder(carId: string, ids: string[]) {
    const photos = await this.list(carId);
    const current = new Set(photos.map((p) => p.id));
    if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((id) => current.has(id))) {
      throw new BadRequestException({ code: "BAD_ORDER", message: "La lista debe incluir todas las fotos del auto, una sola vez" });
    }
    await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.carPhoto.update({ where: { id }, data: { position } })),
    );
    return this.list(carId);
  }

  async update(carId: string, photoId: string, data: { alt?: string; isCover?: boolean }) {
    const photo = await this.prisma.carPhoto.findFirst({ where: { id: photoId, carId } });
    if (!photo) throw new NotFoundException({ code: "PHOTO_NOT_FOUND", message: "Foto no encontrada" });
    if (data.isCover) {
      await this.prisma.$transaction([
        this.prisma.carPhoto.updateMany({ where: { carId }, data: { isCover: false } }),
        this.prisma.carPhoto.update({ where: { id: photoId }, data: { isCover: true, alt: data.alt } }),
      ]);
    } else {
      await this.prisma.carPhoto.update({ where: { id: photoId }, data: { alt: data.alt, isCover: data.isCover } });
    }
    return this.list(carId);
  }

  async remove(carId: string, photoId: string) {
    const photo = await this.prisma.carPhoto.findFirst({ where: { id: photoId, carId } });
    if (!photo) throw new NotFoundException({ code: "PHOTO_NOT_FOUND", message: "Foto no encontrada" });
    await this.prisma.carPhoto.delete({ where: { id: photoId } });
    await this.storage.deleteMany(allVariantKeys(photo.storageKey));

    const rest = await this.list(carId);
    await this.prisma.$transaction(
      rest.map((p, position) =>
        this.prisma.carPhoto.update({
          where: { id: p.id },
          data: { position, isCover: photo.isCover ? position === 0 : p.isCover },
        }),
      ),
    );
    return this.list(carId);
  }

  /** Borra los archivos de todas las fotos de un auto (las filas se eliminan en cascada con el auto). */
  async deleteFilesForCar(carId: string) {
    const photos = await this.list(carId);
    await this.storage.deleteMany(photos.flatMap((p) => allVariantKeys(p.storageKey)));
  }
}
