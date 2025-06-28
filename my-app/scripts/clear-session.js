// clear-sessions.js
const { PrismaClient } = require('@prisma/client');

async function clearAllSessions() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🧹 Nettoyage des sessions...");
    
    // Supprimer toutes les sessions NextAuth
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ ${deletedSessions.count} sessions supprimées`);
    
    // Optionnel: Supprimer les tokens de vérification expirés
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    console.log(`✅ ${deletedTokens.count} tokens expirés supprimés`);
    
    console.log("🎉 Nettoyage terminé!");
    console.log("💡 Redémarre ton serveur et vide le cache de ton navigateur");
    
  } catch (error) {
    console.error("💥 Erreur lors du nettoyage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();