import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service.js";
import type { JwtPayload } from "./auth.types.js";

const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_S = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  // Hash real, generado al arrancar, para igualar tiempos cuando el email no existe.
  private dummyHash: Promise<string> = argon2.hash("dummy-password-for-timing");

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const ok = await argon2.verify(hash, password).catch(() => false);
    if (!user || !user.active || !ok) {
      throw new UnauthorizedException({ code: "BAD_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }
    return user;
  }

  async issueTokens(user: { id: string; role: JwtPayload["role"] }) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const [access, refresh] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: ACCESS_TTL_S,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: REFRESH_TTL_S,
      }),
    ]);
    return { access, refresh, accessTtlMs: ACCESS_TTL_S * 1000, refreshTtlMs: REFRESH_TTL_S * 1000 };
  }

  /** Cambia la contraseña verificando la actual. Devuelve el usuario para reemitir la sesión. */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const ok = user ? await argon2.verify(user.passwordHash, currentPassword).catch(() => false) : false;
    if (!user || !user.active || !ok) {
      throw new UnauthorizedException({ code: "BAD_CREDENTIALS", message: "La contraseña actual no es correcta" });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(newPassword) } });
    return user;
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException({ code: "NO_TOKEN", message: "No autenticado" });
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Sesión vencida" });
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Sesión vencida" });
    }
    return user;
  }
}
