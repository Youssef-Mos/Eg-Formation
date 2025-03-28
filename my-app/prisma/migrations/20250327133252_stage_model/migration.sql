/*
  Warnings:

  - You are about to drop the column `date` on the `Stage` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Stage` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Stage` table. All the data in the column will be lost.
  - Added the required column `Adresse` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CodePostal` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DateDebut` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DateFin` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HeureDebut` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HeureFin` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `PlaceDisponibles` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Prix` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Titre` to the `Stage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Ville` to the `Stage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stage" DROP COLUMN "date",
DROP COLUMN "location",
DROP COLUMN "title",
ADD COLUMN     "Adresse" TEXT NOT NULL,
ADD COLUMN     "CodePostal" TEXT NOT NULL,
ADD COLUMN     "DateDebut" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "DateFin" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "HeureDebut" TEXT NOT NULL,
ADD COLUMN     "HeureFin" TEXT NOT NULL,
ADD COLUMN     "PlaceDisponibles" INTEGER NOT NULL,
ADD COLUMN     "Prix" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "Titre" TEXT NOT NULL,
ADD COLUMN     "Ville" TEXT NOT NULL;
