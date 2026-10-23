import type { RoleT } from "@batalla/shared";

export interface JwtPayload {
  sub: string;
  role: RoleT;
}

export interface AuthUser {
  id: string;
  role: RoleT;
}
