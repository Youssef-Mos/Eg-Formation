import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = "admin@example.com"; // Mets ici l'email que tu veux
    const adminPassword = "admin123"; // Mets ici le mot de passe sécurisé

    // Vérifie si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("⚠️ Un admin existe déjà !");
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    });

    console.log("✅ Admin créé avec succès :", admin);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin :", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createAdmin();
