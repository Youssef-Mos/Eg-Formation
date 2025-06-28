-- CreateTable
CREATE TABLE "Usercreateion" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone1" TEXT NOT NULL,
    "permitNumber" TEXT NOT NULL,
    "permitIssuedAt" TEXT NOT NULL,
    "permitDate" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "address2" TEXT,
    "address3" TEXT,
    "phone2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "Usercreateion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usercreateion_email_key" ON "Usercreateion"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usercreateion_username_key" ON "Usercreateion"("username");
