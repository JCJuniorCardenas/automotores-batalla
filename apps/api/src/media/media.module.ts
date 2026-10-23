import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { MediaController } from "./media.controller.js";
import { PhotosService } from "./photos.service.js";
import { SpinController } from "./spin.controller.js";
import { SpinService } from "./spin.service.js";
import { createStorage } from "./storage.js";

@Module({
  controllers: [MediaController, SpinController],
  providers: [
    {
      provide: PhotosService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PhotosService(prisma, createStorage()),
    },
    {
      provide: SpinService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new SpinService(prisma, createStorage()),
    },
  ],
  exports: [PhotosService, SpinService],
})
export class MediaModule {}
