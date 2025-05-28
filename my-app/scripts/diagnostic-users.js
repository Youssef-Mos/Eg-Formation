// diagnostic-users.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function diagnosticUsers() {
  const prisma = new PrismaClient();
  
  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log("👥 Utilisateurs trouvés:", users.length);
    console.log("=====================================");
    
    for (const user of users) {
      console.log(`\n🔍 Utilisateur: ${user.username} (${user.email})`);
      console.log(`📋 Rôle: ${user.role}`);
      console.log(`📅 Créé: ${user.createdAt}`);
      console.log(`🔒 Hash: ${user.password.substring(0, 30)}...`);
      
      // Tester différents mots de passe possibles
      const possiblePasswords = [
        'password123',
        'admin123',
        '123456',
        'motdepasse',
        user.username, // Parfois le username est utilisé comme mdp
        user.username + '123'
      ];
      
      let passwordFound = false;
      for (const testPassword of possiblePasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          if (isValid) {
            console.log(`✅ Mot de passe trouvé: "${testPassword}"`);
            passwordFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Erreur bcrypt pour "${testPassword}":`, error.message);
        }
      }
      
      if (!passwordFound) {
        console.log(`❌ Aucun mot de passe testé ne fonctionne`);
        console.log(`💡 Le hash semble invalide ou utilise une méthode différente`);
      }
    }
    
  } catch (error) {
    console.error("💥 Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour réinitialiser tous les mots de passe
async function resetAllPasswords() {
  const prisma = new PrismaClient();
  
  const defaultPassword = "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);
  
  try {
    const result = await prisma.user.updateMany({
      data: { password: hashedPassword }
    });
    
    console.log(`✅ ${result.count} mots de passe réinitialisés vers: ${defaultPassword}`);
    
    // Créer un admin si il n'existe pas
    const adminExists = await prisma.user.findFirst({
      where: { role: "admin" }
    });
    
    if (!adminExists) {
      const admin = await prisma.user.create({
        data: {
          username: "admin",
          email: "admin@egformation.com",
          password: hashedPassword,
          role: "admin",
          firstName: "Admin",
          lastName: "EG-Formation",
          birthDate: new Date("1990-01-01"),
          birthPlace: "Paris",
          address1: "123 Admin Street",
          postalCode: "75001",
          city: "Paris", 
          phone1: "0123456789",
          permitNumber: "ADMIN123",
          permitIssuedAt: "Prefecture",
          permitDate: new Date("2020-01-01"),
          acceptTerms: true,
          acceptRules: true,
          confirmPointsCheck: true
        }
      });
      
      console.log("✅ Compte admin créé:", admin.username);
    }
    
  } catch (error) {
    console.error("💥 Erreur lors de la réinitialisation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Menu interactif
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--reset')) {
    console.log("🔄 Réinitialisation de tous les mots de passe...");
    await resetAllPasswords();
  } else {
    console.log("🔍 Diagnostic des utilisateurs...");
    await diagnosticUsers();
    console.log("\n💡 Pour réinitialiser tous les mots de passe: node diagnostic-users.js --reset");
  }
}

main();