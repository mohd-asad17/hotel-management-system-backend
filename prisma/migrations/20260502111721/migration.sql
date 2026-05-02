/*
  Warnings:

  - You are about to drop the column `RoomType` on the `Room` table. All the data in the column will be lost.
  - Added the required column `roomType` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "RoomType",
ADD COLUMN     "roomType" TEXT NOT NULL;
