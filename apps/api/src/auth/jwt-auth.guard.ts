import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { AuthUser, JwtPayload } from "./auth.types.js";

export const ACCESS_COOKIE = "ab_access";
export const REFRESH_COOKIE = "ab_refresh";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException({ code: "NO_TOKEN", message: "No autenticado" });
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Sesión inválida o vencida" });
    }
  }
}
