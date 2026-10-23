import { describe, expect, it, vi } from "vitest";
import { InquiriesService } from "./inquiries.service.js";

function setup(carExists = true) {
  const create = vi.fn(async () => ({}));
  const prisma = {
    inquiry: { create },
    car: { findUnique: vi.fn(async () => (carExists ? { id: "car1" } : null)) },
  };
  return { create, service: new InquiriesService(prisma as never) };
}

const base = { name: "Ana", phone: "3772 123456", message: "Hola, ¿sigue disponible?" };

describe("InquiriesService.create", () => {
  it("guarda la consulta asociada al auto", async () => {
    const { service, create } = setup();
    await service.create({ ...base, carId: "car1", email: "" });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ carId: "car1", email: null, source: "FORM" }),
    });
  });

  it("ignora un carId inexistente en lugar de fallar", async () => {
    const { service, create } = setup(false);
    await service.create({ ...base, carId: "nope" });
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ carId: null }) });
  });

  it("no guarda nada si el honeypot viene completo, pero responde ok", async () => {
    const { service, create } = setup();
    expect(await service.create({ ...base, website: "http://spam" })).toEqual({ ok: true });
    expect(create).not.toHaveBeenCalled();
  });
});
