import * as argon2 from "argon2";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

let hash: string;
beforeAll(async () => {
  hash = await argon2.hash("Actual-12345");
});

function setup(active = true) {
  const update = vi.fn(async () => ({}));
  const prisma = {
    user: {
      findUnique: vi.fn(async () => ({ id: "u1", role: "ADMIN", active, passwordHash: hash })),
      update,
    },
  };
  return { update, service: new AuthService(prisma as never, {} as never, {} as never) };
}

describe("AuthService.changePassword", () => {
  it("guarda un hash nuevo (no la contraseña en claro) cuando la actual es correcta", async () => {
    const { service, update } = setup();
    await service.changePassword("u1", "Actual-12345", "Nueva-67890");
    const calls = update.mock.calls as unknown as [{ data: { passwordHash: string } }][];
    const saved = calls[0]![0].data.passwordHash;
    expect(saved).not.toContain("Nueva-67890");
    expect(await argon2.verify(saved, "Nueva-67890")).toBe(true);
  });

  it("rechaza si la contraseña actual es incorrecta y no modifica nada", async () => {
    const { service, update } = setup();
    await expect(service.changePassword("u1", "otra-cosa-123", "Nueva-67890")).rejects.toMatchObject({
      response: { code: "BAD_CREDENTIALS" },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rechaza si el usuario está desactivado", async () => {
    const { service } = setup(false);
    await expect(service.changePassword("u1", "Actual-12345", "Nueva-67890")).rejects.toBeTruthy();
  });
});
