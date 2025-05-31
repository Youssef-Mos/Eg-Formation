// app/api/stages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// GET - Récupérer un stage spécifique avec son agrément
export const GET = async (
  request: NextRequest, 
  { params }: { params: { id: string } }
) => {
  try {
    const stageId = parseInt(params.id);
    
    if (isNaN(stageId)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          code: "INVALID_ID",
          message: "L'ID du stage doit être un nombre."
        },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        agrement: true, // Inclure les données d'agrément
        reservations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            reservations: true
          }
        }
      }
    });

    if (!stage) {
      return NextResponse.json(
        {
          error: "Stage non trouvé",
          code: "STAGE_NOT_FOUND",
          message: "Le stage spécifié n'existe pas."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ stage }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la récupération du stage:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "FETCH_FAILED",
        message: "Erreur lors de la récupération du stage."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

// DELETE - Supprimer un stage (avec vérification des agréments)
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { session }: { session: any }
) => {
  try {
    // Extract id from the URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/Stage\/(\d+)/i);
    const idStr = idMatch ? idMatch[1] : null;
    const stageId = idStr ? parseInt(idStr) : NaN;
    
    if (isNaN(stageId)) {
      logApiAccess(request, session, false, "INVALID_ID");
      return NextResponse.json(
        {
          error: "ID invalide",
          code: "INVALID_ID",
          message: "L'ID du stage doit être un nombre."
        },
        { status: 400 }
      );
    }

    // Vérifier si le stage existe
    const existingStage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        _count: {
          select: {
            reservations: true
          }
        }
      }
    });

    if (!existingStage) {
      logApiAccess(request, session, false, "STAGE_NOT_FOUND");
      return NextResponse.json(
        {
          error: "Stage non trouvé",
          code: "STAGE_NOT_FOUND",
          message: "Le stage spécifié n'existe pas."
        },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des réservations
    if (existingStage._count.reservations > 0) {
      logApiAccess(request, session, false, "STAGE_HAS_RESERVATIONS");
      return NextResponse.json(
        {
          error: "Stage avec réservations",
          code: "STAGE_HAS_RESERVATIONS",
          message: `Impossible de supprimer ce stage car ${existingStage._count.reservations} réservation(s) y sont liées.`
        },
        { status: 409 }
      );
    }

    // Supprimer le stage
    await prisma.stage.delete({
      where: { id: stageId }
    });

    logApiAccess(request, session, true);
    return NextResponse.json(
      { message: "Stage supprimé avec succès" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erreur lors de la suppression du stage:", error);
    logApiAccess(request, session, false, "DELETE_FAILED");
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "DELETE_FAILED",
        message: "Erreur lors de la suppression du stage."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});