-- AlterTable
ALTER TABLE "Stage" ADD COLUMN     "agrementId" INTEGER;

-- CreateTable
CREATE TABLE "Agrement" (
    "id" SERIAL NOT NULL,
    "departement" TEXT NOT NULL,
    "numeroAgrement" TEXT NOT NULL,
    "nomDepartement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agrement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agrement_numeroAgrement_key" ON "Agrement"("numeroAgrement");

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_agrementId_fkey" FOREIGN KEY ("agrementId") REFERENCES "Agrement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
