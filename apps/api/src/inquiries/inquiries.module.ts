import { Module } from "@nestjs/common";
import { AdminInquiriesController, PublicInquiriesController } from "./inquiries.controller.js";
import { InquiriesService } from "./inquiries.service.js";

@Module({
  controllers: [PublicInquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
