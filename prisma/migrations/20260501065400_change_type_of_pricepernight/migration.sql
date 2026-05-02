/*
  Warnings:

  - You are about to alter the column `pricePerNight` on the `Room` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "pricePerNight" SET DATA TYPE INTEGER;
