import { SetMetadata } from "@nestjs/common";
import type { RoleT } from "@batalla/shared";

export const ROLES_KEY = "roles";
export const Roles = (...roles: RoleT[]) => SetMetadata(ROLES_KEY, roles);
