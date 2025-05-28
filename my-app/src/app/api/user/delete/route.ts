// app/api/user/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export const DELETE = withAuth(async (request: NextRequest, { session }) => {
  const userId = Number(session.user.id);

  try {
    // 1. Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    if (!user) {
      logApiAccess(request, session, false, "USER_NOT_FOUND");
      return NextResponse.json(
        { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 2. Empêcher la suppression des comptes admin (protection supplémentaire)
    if (user.role === "admin") {
      logApiAccess(request, session, false, "ADMIN_CANNOT_DELETE_SELF");
      return NextResponse.json(
        { 
          error: "Les administrateurs ne peuvent pas supprimer leur propre compte", 
          code: "ADMIN_CANNOT_DELETE_SELF" 
        },
        { status: 403 }
      );
    }

    // 3. Vérifier s'il y a des réservations actives
    const activeReservations = await prisma.reservation.count({
      where: { userId }
    });

    if (activeReservations > 0) {
      logApiAccess(request, session, false, "USER_HAS_ACTIVE_RESERVATIONS");
      return NextResponse.json(
        { 
          error: "Impossible de supprimer le compte car vous avez des réservations actives", 
          code: "USER_HAS_ACTIVE_RESERVATIONS",
          reservationsCount: activeReservations 
        },
        { status: 409 }
      );
    }

    // 4. Vérifier s'il y a des factures liées
    const invoicesCount = await prisma.invoice.count({
      where: { userId }
    });

    if (invoicesCount > 0) {
      // Supprimer les factures associées (ou les anonymiser selon votre politique)
      await prisma.invoice.deleteMany({
        where: { userId }
      });
      console.log(`🗑️ Deleted ${invoicesCount} invoices for user ${user.email}`);
    }

    // 5. Supprimer les sessions NextAuth
    await prisma.session.deleteMany({
      where: { userId }
    });

    // 6. Supprimer les comptes OAuth associés
    await prisma.account.deleteMany({
      where: { userId }
    });

    // 7. Supprimer l'utilisateur
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    // 8. Logger la suppression pour audit
    console.log(`🗑️ Account deleted: ${deletedUser.email} (ID: ${deletedUser.id}) at ${new Date().toISOString()}`);
    
    logApiAccess(request, session, true);
    return NextResponse.json({
      message: "Compte supprimé avec succès",
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: `${deletedUser.firstName} ${deletedUser.lastName}`.trim(),
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erreur lors de la suppression du compte:", error);
    logApiAccess(request, session, false, "DELETE_ACCOUNT_FAILED");
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: "Impossible de supprimer le compte en raison de données liées", 
          code: "FOREIGN_KEY_CONSTRAINT" 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la suppression du compte", 
        code: "DELETE_ACCOUNT_FAILED" 
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

export async function POST() {
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