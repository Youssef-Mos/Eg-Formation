// app/api/Stage/DeleteStage/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Wrapper spécialisé pour les routes DELETE avec paramètres dynamiques
async function withAdminAuthAndParams(
  request: NextRequest,
  params: { id: string },
  handler: (request: NextRequest, context: { session: any; params: { id: string } }) => Promise<NextResponse>
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }
  
  return handler(request, { session: session!, params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuthAndParams(request, params, async (req, { session, params }) => {
    const { id } = await params;
    
    if (!id) {
      logApiAccess(req, session, false, "MISSING_STAGE_ID");
      return NextResponse.json(
        { error: "ID du stage requis", code: "MISSING_STAGE_ID" },
        { status: 400 }
      );
    }

    const stageId = Number(id);
    if (!validators.isValidId(stageId)) {
      logApiAccess(req, session, false, "INVALID_STAGE_ID");
      return NextResponse.json(
        { error: "ID du stage invalide", code: "INVALID_STAGE_ID" },
        { status: 400 }
      );
    }

    try {
      // Vérifier s'il y a des réservations pour ce stage
      const reservationsCount = await prisma.reservation.count({
        where: { stageId }
      });

      if (reservationsCount > 0) {
        logApiAccess(req, session, false, "STAGE_HAS_RESERVATIONS");
        return NextResponse.json(
          {
            error: "Impossible de supprimer un stage avec des réservations existantes",
            code: "STAGE_HAS_RESERVATIONS",
            reservationsCount
          },
          { status: 409 }
        );
      }

      const stage = await prisma.stage.delete({
        where: { id: stageId },
      });

      logApiAccess(req, session, true);
      return NextResponse.json(stage, { status: 200 });
    } catch (error) {
      console.error("Erreur API lors de la suppression du stage:", error);
      logApiAccess(req, session, false, "DELETE_FAILED");
      return NextResponse.json(
        { error: "Erreur lors de la suppression du stage", code: "DELETE_FAILED" },
        { status: 500 }
      );
    }
  });
}