import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleT } from "@batalla/shared";
import { ROLES_KEY } from "./roles.decorator.js";
import type { AuthUser } from "./auth.types.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleT[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const user = ctx.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "No tenés permisos para esto" });
    }
    return true;
  }
}
