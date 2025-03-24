"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma"; // Assure-toi d'importer correctement ta base de données

export async function createUser(formData: FormData) {
  const firstName = formData.get("firstName") as string | null;
  const lastName = formData.get("lastName") as string | null;
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const phone1 = formData.get("phone1") as string | null;
  const phone2 = formData.get("phone2") as string | null;
  const address1 = formData.get("address1") as string | null;
  const address2 = formData.get("address2") as string | null;

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Tous les champs obligatoires doivent être remplis");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone1,
      phone2,
      address1,
      address2,
    },
  });
}
