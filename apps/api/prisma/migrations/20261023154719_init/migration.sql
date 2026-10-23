-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('ZERO_KM', 'USED');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "Fuel" AS ENUM ('NAFTA', 'DIESEL', 'GNC', 'HIBRIDO', 'ELECTRICO');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATICA');

-- CreateEnum
CREATE TYPE "SpinStatus" AS ENUM ('DRAFT', 'READY');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('FORM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "year" INTEGER NOT NULL,
    "condition" "CarCondition" NOT NULL,
    "priceAmount" DECIMAL(14,2) NOT NULL,
    "priceCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "mileageKm" INTEGER,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "bodyType" TEXT,
    "color" TEXT,
    "doors" INTEGER,
    "engine" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "CarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "onOffer" BOOLEAN NOT NULL DEFAULT false,
    "offerPrice" DECIMAL(14,2),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarPhoto" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "isCover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CarPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinSequence" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "frameCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SpinStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinFrame" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "SpinFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "source" "InquirySource" NOT NULL DEFAULT 'FORM',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");

-- CreateIndex
CREATE INDEX "Car_status_condition_idx" ON "Car"("status", "condition");

-- CreateIndex
CREATE INDEX "Car_brand_idx" ON "Car"("brand");

-- CreateIndex
CREATE INDEX "Car_year_idx" ON "Car"("year");

-- CreateIndex
CREATE INDEX "Car_priceAmount_idx" ON "Car"("priceAmount");

-- CreateIndex
CREATE INDEX "CarPhoto_carId_position_idx" ON "CarPhoto"("carId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SpinSequence_carId_key" ON "SpinSequence"("carId");

-- CreateIndex
CREATE UNIQUE INDEX "SpinFrame_sequenceId_position_key" ON "SpinFrame"("sequenceId", "position");

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CarPhoto" ADD CONSTRAINT "CarPhoto_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinSequence" ADD CONSTRAINT "SpinSequence_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpinFrame" ADD CONSTRAINT "SpinFrame_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "SpinSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
