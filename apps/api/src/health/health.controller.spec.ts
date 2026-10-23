import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("responde ok si la DB contesta", async () => {
    const prisma = { $queryRaw: async () => [{ "?column?": 1 }] };
    const controller = new HealthController(prisma as never);
    expect(await controller.check()).toEqual({ status: "ok" });
  });
});
