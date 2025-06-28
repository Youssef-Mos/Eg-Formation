// app/api/reservation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { withAuth, validateRequestData, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Validateur pour les données de réservation
const isValidReservationData = (data: any): data is { stageId: number } => {
  return typeof data === "object" && validators.isValidId(data.stageId);
};

export const POST = withAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData(request, isValidReservationData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_RESERVATION_DATA");
    return error;
  }

  const { stageId } = data!;
  const userId = Number(session.user.id);

  try {
    // Vérifier si le stage existe et a des places disponibles
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

    if (stage.PlaceDisponibles <= 0) {
      logApiAccess(request, session, false, "NO_PLACES_AVAILABLE");
      return NextResponse.json(
        { error: "Plus de places disponibles", code: "NO_PLACES_AVAILABLE" },
        { status: 409 }
      );
    }

    // Vérifier si l'utilisateur n'a pas déjà réservé ce stage
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId,
          stageId
        }
      }
    });

    if (existingReservation) {
      logApiAccess(request, session, false, "ALREADY_RESERVED");
      return NextResponse.json(
        { error: "Vous avez déjà réservé ce stage", code: "ALREADY_RESERVED" },
        { status: 409 }
      );
    }

    // Créer la réservation et décrémenter les places
    const [reservation] = await Promise.all([
      prisma.reservation.create({
        data: { userId, stageId },
      }),
      prisma.stage.update({
        where: { id: stageId },
        data: { PlaceDisponibles: { decrement: 1 } }
      })
    ]);

    logApiAccess(request, session, true);
    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    console.error("Erreur création réservation:", error);
    logApiAccess(request, session, false, "CREATE_FAILED");
    return NextResponse.json(
      { error: "Erreur lors de la création de la réservation", code: "CREATE_FAILED" },
      { status: 500 }
    );
  }
});