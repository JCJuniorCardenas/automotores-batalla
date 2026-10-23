import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { loginSchema, type LoginInput } from "@batalla/shared";
import type { Request, Response } from "express";
import { ZodPipe } from "../common/zod.pipe.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuthService } from "./auth.service.js";
import type { AuthUser } from "./auth.types.js";
import { ACCESS_COOKIE, JwtAuthGuard, REFRESH_COOKIE } from "./jwt-auth.guard.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private setCookies(res: Response, t: Awaited<ReturnType<AuthService["issueTokens"]>>) {
    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };
    res.cookie(ACCESS_COOKIE, t.access, { ...base, path: "/", maxAge: t.accessTtlMs });
    res.cookie(REFRESH_COOKIE, t.refresh, { ...base, path: "/api/auth", maxAge: t.refreshTtlMs });
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(@Body(new ZodPipe(loginSchema)) body: LoginInput, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validate(body.email, body.password);
    this.setCookies(res, await this.auth.issueTokens(user));
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.setCookies(res, await this.auth.issueTokens(user));
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: AuthUser }) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    return { id: user.id, email: user.email, role: user.role };
  }
}
