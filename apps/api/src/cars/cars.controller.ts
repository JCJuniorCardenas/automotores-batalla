import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  carFeaturedSchema,
  carInputSchema,
  carQuerySchema,
  carStatusSchema,
  carUpdateSchema,
  type CarInput,
  type CarQuery,
} from "@batalla/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { CarsService } from "./cars.service.js";

@Controller("cars")
export class PublicCarsController {
  constructor(private readonly cars: CarsService) {}

  @Get()
  list(@Query(new ZodPipe(carQuerySchema)) q: CarQuery) {
    return this.cars.list(q, true);
  }

  @Get("filters")
  filters() {
    return this.cars.filters();
  }

  /** Para el sitemap: slug y última modificación de cada auto publicado. */
  @Get("slugs")
  slugs() {
    return this.cars.slugs();
  }

  @Get(":slug")
  one(@Param("slug") slug: string) {
    return this.cars.getBySlug(slug);
  }
}

@Controller("admin/cars")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AdminCarsController {
  constructor(private readonly cars: CarsService) {}

  @Get()
  list(@Query(new ZodPipe(carQuerySchema)) q: CarQuery) {
    return this.cars.list(q, false);
  }

  @Get(":id")
  one(@Param("id") id: string) {
    return this.cars.getById(id);
  }

  @Post()
  create(@Body(new ZodPipe(carInputSchema)) body: CarInput) {
    return this.cars.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body(new ZodPipe(carUpdateSchema)) body: Partial<CarInput>) {
    return this.cars.update(id, body);
  }

  @Patch(":id/status")
  status(@Param("id") id: string, @Body(new ZodPipe(carStatusSchema)) body: { status: CarInput["status"] }) {
    return this.cars.update(id, body);
  }

  @Patch(":id/featured")
  featured(@Param("id") id: string, @Body(new ZodPipe(carFeaturedSchema)) body: { featured: boolean }) {
    return this.cars.update(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.cars.remove(id);
  }
}
