import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { AdminCarsController, PublicCarsController } from "./cars.controller.js";
import { CarsService } from "./cars.service.js";

@Module({
  imports: [MediaModule],
  controllers: [PublicCarsController, AdminCarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
