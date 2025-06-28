// app/api/Stage/UpdateStage/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validateRequestData, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Wrapper spécialisé pour les routes PUT avec paramètres dynamiques
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

export async function PUT(
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

    // Validation des données
    const { data, error } = await validateRequestData(req, validators.isValidStageData);
    if (error) {
      logApiAccess(req, session, false, "INVALID_STAGE_DATA");
      return error;
    }

    try {
      const updatedStage = await prisma.stage.update({
        where: { id: stageId },
        data: {
          Titre: data!.Titre,
          Adresse: data!.Adresse,
          CodePostal: data!.CodePostal,
          Ville: data!.Ville,
          PlaceDisponibles: data!.PlaceDisponibles,
          DateDebut: new Date(data!.DateDebut),
          DateFin: new Date(data!.DateFin),
          Prix: data!.Prix,
        },
      });

      logApiAccess(req, session, true);
      return NextResponse.json(updatedStage, { status: 200 });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stage:", error);
      logApiAccess(req, session, false, "UPDATE_FAILED");
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du stage", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }
  });
}