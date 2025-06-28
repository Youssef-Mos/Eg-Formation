/*
  Warnings:

  - You are about to drop the `Usercreateion` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "address1" SET DEFAULT 'À compléter',
ALTER COLUMN "birthDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "birthPlace" SET DEFAULT 'À compléter',
ALTER COLUMN "city" SET DEFAULT 'À compléter',
ALTER COLUMN "firstName" SET DEFAULT 'À compléter',
ALTER COLUMN "gender" SET DEFAULT 'male',
ALTER COLUMN "lastName" SET DEFAULT 'À compléter',
ALTER COLUMN "permitDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "permitIssuedAt" SET DEFAULT 'À compléter',
ALTER COLUMN "permitNumber" SET DEFAULT 'À compléter',
ALTER COLUMN "phone1" SET DEFAULT '0000000000',
ALTER COLUMN "postalCode" SET DEFAULT '00000',
ALTER COLUMN "username" SET DEFAULT 'user-${id}';

-- DropTable
DROP TABLE "Usercreateion";
