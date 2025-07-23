// app/api/user/delete/[id]/route.ts - VERSION AVEC STRUCTURE EXPLICITE
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ✅ Fonction pour vérifier si les réservations sont terminées
async function areAllReservationsCompleted(userId: number): Promise<boolean> {
  const now = new Date();
  
  // Compter les réservations dont les stages ne sont pas encore terminés
  const activeReservations = await prisma.reservation.count({
    where: { 
      userId,
      stage: {
        DateFin: {
          gte: now // Date de fin >= maintenant (stage pas encore terminé)
        }
      }
    }
  });
  
  return activeReservations === 0;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Vérifier l'authentification avec next-auth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour effectuer cette action", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const requestedUserId = Number(params.id);
    const sessionUserId = Number(session.user.id);

    // ✅ Vérifier que l'utilisateur supprime bien son propre compte (sauf admin)
    if (session.user.role !== "admin" && requestedUserId !== sessionUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que votre propre compte", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // ✅ Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ✅ Empêcher la suppression des comptes admin (protection supplémentaire)
    if (user.role === "admin" && session.user.role !== "admin") {
      return NextResponse.json(
        { 
          error: "Impossible de supprimer un compte administrateur", 
          code: "ADMIN_CANNOT_BE_DELETED" 
        },
        { status: 403 }
      );
    }

    // ✅ Vérifier que toutes les réservations sont terminées
    const allReservationsCompleted = await areAllReservationsCompleted(requestedUserId);
    
    if (!allReservationsCompleted) {
      // Récupérer les détails des réservations actives pour informer l'utilisateur
      const activeReservations = await prisma.reservation.findMany({
        where: { 
          userId: requestedUserId,
          stage: {
            DateFin: {
              gte: new Date()
            }
          }
        },
        include: {
          stage: {
            select: {
              Titre: true,
              DateDebut: true,
              DateFin: true,
              Ville: true
            }
          }
        }
      });

      return NextResponse.json(
        { 
          error: "Impossible de supprimer le compte car vous avez des stages non terminés", 
          code: "USER_HAS_ACTIVE_RESERVATIONS",
          activeReservations: activeReservations.map(res => ({
            stageTitle: res.stage.Titre,
            city: res.stage.Ville,
            startDate: res.stage.DateDebut.toISOString().split('T')[0],
            endDate: res.stage.DateFin.toISOString().split('T')[0]
          }))
        },
        { status: 409 }
      );
    }

    // ✅ Supprimer les données liées dans l'ordre correct
    console.log(`🗑️ Début de suppression pour l'utilisateur ${user.email} (ID: ${user.id})`);

    // 1. Supprimer les factures associées
    const invoicesCount = await prisma.invoice.count({ where: { userId: requestedUserId } });
    if (invoicesCount > 0) {
      await prisma.invoice.deleteMany({ where: { userId: requestedUserId } });
      console.log(`🗑️ Supprimé ${invoicesCount} factures`);
    }

    // 2. Supprimer les documents de permis
    await prisma.permitDocument.deleteMany({ where: { userId: requestedUserId } });

    // 3. Supprimer les notifications
    await prisma.notification.deleteMany({ where: { userId: requestedUserId } });

    // 4. Supprimer les réservations (toutes terminées à ce stade)
    const reservationsCount = await prisma.reservation.count({ where: { userId: requestedUserId } });
    if (reservationsCount > 0) {
      await prisma.reservation.deleteMany({ where: { userId: requestedUserId } });
      console.log(`🗑️ Supprimé ${reservationsCount} réservations terminées`);
    }

    // 5. Supprimer les sessions NextAuth
    await prisma.session.deleteMany({ where: { userId: requestedUserId } });

    // 6. Supprimer les comptes OAuth associés
    await prisma.account.deleteMany({ where: { userId: requestedUserId } });

    // 7. Supprimer l'utilisateur
    const deletedUser = await prisma.user.delete({
      where: { id: requestedUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    // ✅ Logger la suppression pour audit
    console.log(`✅ Compte supprimé avec succès: ${deletedUser.email} (ID: ${deletedUser.id}) le ${new Date().toISOString()}`);
    
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
    console.error("❌ Erreur lors de la suppression du compte:", error);
    
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
        code: "DELETE_ACCOUNT_FAILED",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ Méthodes non autorisées
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