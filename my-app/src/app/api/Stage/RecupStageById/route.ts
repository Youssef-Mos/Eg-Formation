// app/api/stages/by-id/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { requireAuth: false });
  
  if (error) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    logApiAccess(request, session, false, "MISSING_STAGE_ID");
    return NextResponse.json(
      { error: "L'identifiant du stage est requis", code: "MISSING_STAGE_ID" },
      { status: 400 }
    );
  }

  const stageId = Number(id);
  if (!validators.isValidId(stageId)) {
    logApiAccess(request, session, false, "INVALID_STAGE_ID");
    return NextResponse.json(
      { error: "ID du stage invalide", code: "INVALID_STAGE_ID" },
      { status: 400 }
    );
  }

  try {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId }
    });

    if (!stage) {
      logApiAccess(request, session, false, "STAGE_NOT_FOUND");
      return NextResponse.json(
        { error: "Stage non trouvé", code: "STAGE_NOT_FOUND" },
        { status: 404 }
      );
    }

    logApiAccess(request, session, true);
    return NextResponse.json(stage);
  } catch (error: any) {
    console.error("Erreur lors de la récupération du stage:", error);
    logApiAccess(request, session, false, "FETCH_FAILED");
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération du stage", code: "FETCH_FAILED" },
      { status: 500 }
    );
  }
}