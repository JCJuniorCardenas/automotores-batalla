import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SPIN_MAX_FRAMES, SPIN_MIN_FRAMES } from "@batalla/shared";
import type { PrismaService } from "../prisma/prisma.service.js";
import { InvalidImageError, spinVariantKeys, storeSpinFrame } from "./image-processor.js";
import { naturalCompare, type UploadedImage } from "./photos.service.js";
import type { StorageDriver } from "./storage.js";

type Db = Pick<PrismaService, "car" | "spinSequence" | "spinFrame" | "$transaction">;

/** Secuencias 360° (una por auto). Sin decoradores de Nest para poder usarla también desde el seed. */
export class SpinService {
  constructor(
    private readonly prisma: Db,
    private readonly storage: StorageDriver,
  ) {}

  private async requireCar(carId: string) {
    const car = await this.prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
    if (!car) throw new NotFoundException({ code: "CAR_NOT_FOUND", message: "Auto no encontrado" });
  }

  get(carId: string) {
    return this.prisma.spinSequence.findUnique({
      where: { carId },
      include: { frames: { orderBy: { position: "asc" } } },
    });
  }

  /** Reemplaza la secuencia completa. Los frames se ordenan por nombre de archivo (orden natural). */
  async replace(carId: string, files: UploadedImage[]) {
    await this.requireCar(carId);
    if (files.length < SPIN_MIN_FRAMES || files.length > SPIN_MAX_FRAMES) {
      throw new BadRequestException({
        code: "BAD_FRAME_COUNT",
        message: `Subí entre ${SPIN_MIN_FRAMES} y ${SPIN_MAX_FRAMES} imágenes (lo ideal son 24 a 36). Recibimos ${files.length}.`,
      });
    }
    const sorted = [...files].sort((a, b) => naturalCompare(a.name, b.name));
    const stored = [];
    try {
      for (const f of sorted) stored.push(await storeSpinFrame(this.storage, `cars/${carId}/spin`, f.buffer));
    } catch (e) {
      await this.storage.deleteMany(stored.flatMap((s) => spinVariantKeys(s.storageKey))).catch(() => undefined);
      if (e instanceof InvalidImageError) throw new BadRequestException({ code: "INVALID_IMAGE", message: e.message });
      throw e;
    }

    const previous = await this.get(carId);
    await this.prisma.$transaction([
      ...(previous ? [this.prisma.spinSequence.delete({ where: { carId } })] : []),
      this.prisma.spinSequence.create({
        data: {
          carId,
          frameCount: stored.length,
          status: "READY",
          frames: { create: stored.map((s, position) => ({ ...s, position })) },
        },
      }),
    ]);
    if (previous) await this.storage.deleteMany(previous.frames.flatMap((f) => spinVariantKeys(f.storageKey)));
    return this.get(carId);
  }

  async reorder(carId: string, ids: string[]) {
    const seq = await this.get(carId);
    if (!seq) throw new NotFoundException({ code: "SPIN_NOT_FOUND", message: "Este auto no tiene 360°" });
    const current = new Set(seq.frames.map((f) => f.id));
    if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((id) => current.has(id))) {
      throw new BadRequestException({ code: "BAD_ORDER", message: "La lista debe incluir todos los frames, una sola vez" });
    }
    // position es único por secuencia: pasamos por valores negativos para evitar choques intermedios.
    await this.prisma.$transaction([
      ...ids.map((id, i) => this.prisma.spinFrame.update({ where: { id }, data: { position: -(i + 1) } })),
      ...ids.map((id, i) => this.prisma.spinFrame.update({ where: { id }, data: { position: i } })),
    ]);
    return this.get(carId);
  }

  async remove(carId: string) {
    const seq = await this.get(carId);
    if (!seq) throw new NotFoundException({ code: "SPIN_NOT_FOUND", message: "Este auto no tiene 360°" });
    await this.prisma.spinSequence.delete({ where: { carId } });
    await this.storage.deleteMany(seq.frames.flatMap((f) => spinVariantKeys(f.storageKey)));
  }
}
