-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingAddress1" TEXT,
ADD COLUMN     "billingAddress2" TEXT,
ADD COLUMN     "billingAddress3" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "useSameAddressForBilling" BOOLEAN NOT NULL DEFAULT true;
