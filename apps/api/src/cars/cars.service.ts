import { Injectable, NotFoundException } from "@nestjs/common";
import type { CarInput, CarQuery } from "@batalla/shared";
import { slugify } from "../common/slug.js";
import { frameUrls, photoUrls } from "../media/image-urls.js";
import { PhotosService } from "../media/photos.service.js";
import { SpinService } from "../media/spin.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";

const PUBLIC_STATUSES = ["AVAILABLE", "RESERVED"] as const;

type CarWithPhotos = Prisma.CarGetPayload<{ include: { photos: true; spin: { include: { frames: true } } } }>;

export function serializeCar(car: CarWithPhotos) {
  const { priceAmount, offerPrice, photos, spin, ...rest } = car;
  return {
    ...rest,
    priceAmount: Number(priceAmount),
    offerPrice: offerPrice == null ? null : Number(offerPrice),
    photos: [...photos]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ ...p, urls: photoUrls(p.storageKey) })),
    spin: spin
      ? {
          ...spin,
          frames: [...spin.frames]
            .sort((a, b) => a.position - b.position)
            .map((f) => ({ ...f, urls: frameUrls(f.storageKey) })),
        }
      : null,
  };
}

const include = { photos: true, spin: { include: { frames: true } } } as const;

function orderBy(sort: CarQuery["sort"]): Prisma.CarOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceAmount: "asc" }];
    case "price_desc":
      return [{ priceAmount: "desc" }];
    case "year_desc":
      return [{ year: "desc" }, { createdAt: "desc" }];
    case "km_asc":
      return [{ mileageKm: { sort: "asc", nulls: "first" } }];
    default:
      return [{ createdAt: "desc" }];
  }
}

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photos: PhotosService,
    private readonly spin: SpinService,
  ) {}

  private where(q: CarQuery, publicOnly: boolean): Prisma.CarWhereInput {
    const and: Prisma.CarWhereInput[] = [];
    if (publicOnly) and.push({ status: { in: [...PUBLIC_STATUSES] } });
    if (q.brand) and.push({ brand: { equals: q.brand, mode: "insensitive" } });
    if (q.model) and.push({ model: { contains: q.model, mode: "insensitive" } });
    if (q.condition) and.push({ condition: q.condition });
    if (q.fuel) and.push({ fuel: q.fuel });
    if (q.transmission) and.push({ transmission: q.transmission });
    if (q.currency) and.push({ priceCurrency: q.currency });
    if (q.featured !== undefined) and.push({ featured: q.featured });
    if (q.yearMin != null || q.yearMax != null) {
      and.push({ year: { gte: q.yearMin, lte: q.yearMax } });
    }
    if (q.priceMin != null || q.priceMax != null) {
      and.push({ priceAmount: { gte: q.priceMin, lte: q.priceMax } });
    }
    if (q.kmMax != null) and.push({ mileageKm: { lte: q.kmMax } });
    if (q.q) {
      and.push({
        OR: [
          { brand: { contains: q.q, mode: "insensitive" } },
          { model: { contains: q.q, mode: "insensitive" } },
          { version: { contains: q.q, mode: "insensitive" } },
        ],
      });
    }
    return { AND: and };
  }

  async list(q: CarQuery, publicOnly = true) {
    const where = this.where(q, publicOnly);
    const [total, items] = await Promise.all([
      this.prisma.car.count({ where }),
      this.prisma.car.findMany({
        where,
        include,
        orderBy: orderBy(q.sort),
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      items: items.map(serializeCar),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  /** Marcas disponibles y rangos, para armar los filtros del catálogo. */
  async filters() {
    const where: Prisma.CarWhereInput = { status: { in: [...PUBLIC_STATUSES] } };
    const [brands, agg] = await Promise.all([
      this.prisma.car.groupBy({ by: ["brand", "model"], where, orderBy: [{ brand: "asc" }, { model: "asc" }] }),
      this.prisma.car.aggregate({
        where,
        _min: { year: true, priceAmount: true },
        _max: { year: true, priceAmount: true, mileageKm: true },
      }),
    ]);
    const byBrand = new Map<string, string[]>();
    for (const b of brands) byBrand.set(b.brand, [...(byBrand.get(b.brand) ?? []), b.model]);
    return {
      brands: [...byBrand].map(([brand, models]) => ({ brand, models })),
      year: { min: agg._min.year, max: agg._max.year },
      price: {
        min: agg._min.priceAmount == null ? null : Number(agg._min.priceAmount),
        max: agg._max.priceAmount == null ? null : Number(agg._max.priceAmount),
      },
      mileageKmMax: agg._max.mileageKm,
    };
  }

  async slugs() {
    const rows = await this.prisma.car.findMany({
      where: { status: { in: [...PUBLIC_STATUSES] } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt }));
  }

  async getBySlug(slug: string) {
    const car = await this.prisma.car.findFirst({
      where: { slug, status: { in: [...PUBLIC_STATUSES] } },
      include,
    });
    if (!car) throw new NotFoundException({ code: "CAR_NOT_FOUND", message: "Auto no encontrado" });
    return serializeCar(car);
  }

  async getById(id: string) {
    const car = await this.prisma.car.findUnique({ where: { id }, include });
    if (!car) throw new NotFoundException({ code: "CAR_NOT_FOUND", message: "Auto no encontrado" });
    return serializeCar(car);
  }

  private async uniqueSlug(base: string, excludeId?: string) {
    let slug = base;
    for (let i = 2; ; i++) {
      const clash = await this.prisma.car.findUnique({ where: { slug } });
      if (!clash || clash.id === excludeId) return slug;
      slug = `${base}-${i}`;
    }
  }

  async create(input: CarInput) {
    const slug = await this.uniqueSlug(slugify(`${input.brand} ${input.model} ${input.year}`));
    const car = await this.prisma.car.create({
      data: { ...input, slug, publishedAt: new Date() },
      include,
    });
    return serializeCar(car);
  }

  async update(id: string, input: Partial<CarInput>) {
    const current = await this.prisma.car.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "CAR_NOT_FOUND", message: "Auto no encontrado" });
    const identityChanged =
      (input.brand && input.brand !== current.brand) ||
      (input.model && input.model !== current.model) ||
      (input.year && input.year !== current.year);
    const slug = identityChanged
      ? await this.uniqueSlug(
          slugify(`${input.brand ?? current.brand} ${input.model ?? current.model} ${input.year ?? current.year}`),
          id,
        )
      : undefined;
    const car = await this.prisma.car.update({ where: { id }, data: { ...input, slug }, include });
    return serializeCar(car);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.photos.deleteFilesForCar(id);
    if (await this.spin.get(id)) await this.spin.remove(id);
    await this.prisma.car.delete({ where: { id } });
  }
}
