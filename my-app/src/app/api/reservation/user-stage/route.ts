// app/api/reservation/user-stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  
  if (!stageId) {
    logApiAccess(request, session, false, "MISSING_STAGE_ID");
    return NextResponse.json(
      { error: "L'identifiant du stage est requis", code: "MISSING_STAGE_ID" },
      { status: 400 }
    );
  }

  const stageIdNum = Number(stageId);
  if (!validators.isValidId(stageIdNum)) {
    logApiAccess(request, session, false, "INVALID_STAGE_ID");
    return NextResponse.json(
      { error: "ID du stage invalide", code: "INVALID_STAGE_ID" },
      { status: 400 }
    );
  }

  try {
    const userId = Number(session.user.id);
    const reservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId,
          stageId: stageIdNum
        }
      }
    });

    if (!reservation) {
      logApiAccess(request, session, false, "RESERVATION_NOT_FOUND");
      return NextResponse.json(
        { error: "Aucune réservation trouvée pour ce stage", code: "RESERVATION_NOT_FOUND" },
        { status: 404 }
      );
    }

    logApiAccess(request, session, true);
    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la réservation:", error);
    logApiAccess(request, session, false, "FETCH_FAILED");
    return NextResponse.json(
      { error: "Erreur serveur", code: "FETCH_FAILED" },
      { status: 500 }
    );
  }
});