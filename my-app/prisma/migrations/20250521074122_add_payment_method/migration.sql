-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'card';
