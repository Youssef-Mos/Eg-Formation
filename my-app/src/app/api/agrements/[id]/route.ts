// app/api/Agrement/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// DELETE - Supprimer un agrément
export const DELETE = withAdminAuth(async (
  request: NextRequest, 
  { session }: { session: any }
) => {
  try {
    // Extraire l'id depuis l'URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/agrements\/(\d+)/i);
    const idStr = idMatch ? idMatch[1] : null;
    const agrementId = idStr ? parseInt(idStr) : NaN;
    
    if (isNaN(agrementId)) {
      logApiAccess(request, session, false, "INVALID_ID");
      return NextResponse.json(
        {
          error: "ID invalide",
          code: "INVALID_ID",
          message: "L'ID de l'agrément doit être un nombre."
        },
        { status: 400 }
      );
    }

    // Vérifier si l'agrément existe
    const existingAgrement = await prisma.agrement.findUnique({
      where: { id: agrementId },
      include: {
        _count: {
          select: {
            stages: true
          }
        }
      }
    });

    if (!existingAgrement) {
      logApiAccess(request, session, false, "AGREMENT_NOT_FOUND");
      return NextResponse.json(
        {
          error: "Agrément non trouvé",
          code: "AGREMENT_NOT_FOUND",
          message: "L'agrément spécifié n'existe pas."
        },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des stages liés à cet agrément
    if (existingAgrement._count.stages > 0) {
      logApiAccess(request, session, false, "AGREMENT_IN_USE");
      return NextResponse.json(
        {
          error: "Agrément utilisé",
          code: "AGREMENT_IN_USE",
          message: `Impossible de supprimer cet agrément car ${existingAgrement._count.stages} stage(s) y sont liés.`
        },
        { status: 409 }
      );
    }

    // Supprimer l'agrément
    await prisma.agrement.delete({
      where: { id: agrementId }
    });

    logApiAccess(request, session, true);
    return NextResponse.json(
      { message: "Agrément supprimé avec succès" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erreur lors de la suppression de l'agrément:", error);
    logApiAccess(request, session, false, "DELETE_FAILED");
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "DELETE_FAILED",
        message: "Erreur lors de la suppression de l'agrément."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});