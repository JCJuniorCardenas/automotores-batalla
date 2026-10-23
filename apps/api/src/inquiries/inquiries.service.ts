import { Injectable, NotFoundException } from "@nestjs/common";
import type { InquiryInput, InquiryQuery, InquiryStatusT } from "@batalla/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: InquiryInput) {
    // Honeypot: un bot completó el campo oculto. Respondemos igual para no darle pistas.
    if (input.website) return { ok: true };

    const car = input.carId
      ? await this.prisma.car.findUnique({ where: { id: input.carId }, select: { id: true } })
      : null;
    await this.prisma.inquiry.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: input.message,
        carId: car?.id ?? null,
        source: "FORM",
      },
    });
    return { ok: true };
  }

  async list(q: InquiryQuery) {
    const where = q.status ? { status: q.status } : {};
    const [total, newCount, items] = await Promise.all([
      this.prisma.inquiry.count({ where }),
      this.prisma.inquiry.count({ where: { status: "NEW" } }),
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { car: { select: { id: true, slug: true, brand: true, model: true, year: true } } },
      }),
    ]);
    return { items, total, newCount, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
  }

  newCount() {
    return this.prisma.inquiry.count({ where: { status: "NEW" } }).then((count) => ({ count }));
  }

  async setStatus(id: string, status: InquiryStatusT) {
    const current = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "INQUIRY_NOT_FOUND", message: "Consulta no encontrada" });
    return this.prisma.inquiry.update({
      where: { id },
      data: { status, readAt: current.readAt ?? new Date() },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "INQUIRY_NOT_FOUND", message: "Consulta no encontrada" });
    await this.prisma.inquiry.delete({ where: { id } });
  }
}
