import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  inquiryInputSchema,
  inquiryQuerySchema,
  inquiryStatusSchema,
  type InquiryInput,
  type InquiryQuery,
  type InquiryStatusT,
} from "@batalla/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { InquiriesService } from "./inquiries.service.js";

@Controller("inquiries")
export class PublicInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  create(@Body(new ZodPipe(inquiryInputSchema)) body: InquiryInput) {
    return this.inquiries.create(body);
  }
}

@Controller("admin/inquiries")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "EDITOR")
export class AdminInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  list(@Query(new ZodPipe(inquiryQuerySchema)) q: InquiryQuery) {
    return this.inquiries.list(q);
  }

  @Get("new-count")
  newCount() {
    return this.inquiries.newCount();
  }

  @Patch(":id")
  setStatus(@Param("id") id: string, @Body(new ZodPipe(inquiryStatusSchema)) body: { status: InquiryStatusT }) {
    return this.inquiries.setStatus(id, body.status);
  }

  @Delete(":id")
  @HttpCode(204)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.inquiries.remove(id);
  }
}
