// app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Validateur pour les données de changement de mot de passe
const isValidPasswordChangeData = (data: any): data is {
  currentPassword: string;
  newPassword: string;
} => {
  if (typeof data !== "object" || data === null) return false;
  
  if (typeof data.currentPassword !== "string" || data.currentPassword.length === 0) return false;
  if (typeof data.newPassword !== "string" || data.newPassword.length < 6) return false;
  
  // Validation renforcée du nouveau mot de passe
  if (!/[A-Z]/.test(data.newPassword)) return false; // Au moins une majuscule
  if (!/[0-9]/.test(data.newPassword)) return false; // Au moins un chiffre
  if (!/[^A-Za-z0-9]/.test(data.newPassword)) return false; // Au moins un caractère spécial
  
  return true;
};

export const POST = withAuth(async (request: NextRequest, { session }) => {
  // Validation des données de la requête
  const { data, error } = await validateRequestData(request, isValidPasswordChangeData);
  if (error) {
    logApiAccess(request, session, false, "INVALID_PASSWORD_DATA");
    return error;
  }

  const { currentPassword, newPassword } = data!;
  const userId = Number(session.user.id);

  try {
    // 1. Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      logApiAccess(request, session, false, "USER_NOT_FOUND");
      return NextResponse.json(
        { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("🔐 === CHANGEMENT DE MOT DE PASSE ===");
    console.log("👤 Utilisateur:", user.email);
    console.log("🔒 Hash actuel (30 premiers chars):", user.password.substring(0, 30));

    // 2. Vérifier l'ancien mot de passe
    let isCurrentPasswordValid = false;
    try {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      console.log("✅ Vérification ancien mot de passe:", isCurrentPasswordValid ? "VALIDE" : "INVALIDE");
    } catch (bcryptError) {
      console.error("💥 Erreur bcrypt lors de la vérification:", bcryptError);
      logApiAccess(request, session, false, "BCRYPT_ERROR");
      return NextResponse.json(
        { error: "Erreur de vérification du mot de passe", code: "BCRYPT_ERROR" },
        { status: 500 }
      );
    }

    if (!isCurrentPasswordValid) {
      logApiAccess(request, session, false, "INVALID_CURRENT_PASSWORD");
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect", code: "INVALID_CURRENT_PASSWORD" },
        { status: 400 }
      );
    }

    // 3. Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logApiAccess(request, session, false, "SAME_PASSWORD");
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'ancien", code: "SAME_PASSWORD" },
        { status: 400 }
      );
    }

    // 4. Hacher le nouveau mot de passe avec le MÊME SALT que les autres (10 au lieu de 12)
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log("🔑 Nouveau hash généré (30 premiers chars):", hashedNewPassword.substring(0, 30));

    // 5. Mettre à jour le mot de passe en base de données
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // 6. Vérifier que le nouveau hash fonctionne
    const testNewPassword = await bcrypt.compare(newPassword, hashedNewPassword);
    console.log("🧪 Test nouveau hash:", testNewPassword ? "SUCCÈS" : "ÉCHEC");

    // 7. Logger l'action de sécurité
    console.log(`🔐 Password changed for user ${user.email} (ID: ${userId}) at ${new Date().toISOString()}`);
    console.log("🔐 === FIN CHANGEMENT DE MOT DE PASSE ===");
    
    logApiAccess(request, session, true);
    return NextResponse.json({
      message: "Mot de passe modifié avec succès",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erreur lors du changement de mot de passe:", error);
    logApiAccess(request, session, false, "PASSWORD_CHANGE_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors du changement de mot de passe", 
        code: "PASSWORD_CHANGE_FAILED" 
      },
      { status: 500 }
    );
  }
});

// Méthodes non autorisées
export async function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Méthode non autorisée", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Méthode non autorisée", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}