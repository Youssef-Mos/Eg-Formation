-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptRules" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmPointsCheck" BOOLEAN NOT NULL DEFAULT false;
