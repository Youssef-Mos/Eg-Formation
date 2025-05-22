/*
  Warnings:

  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetTokenExpiry",
ADD COLUMN     "resetTokenExp" TIMESTAMP(3);
