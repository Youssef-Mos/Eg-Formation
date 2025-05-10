import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, fromStageId, toStageId } = body;

  if (!userId || !fromStageId || !toStageId) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  try {
    // 1. Vérifier que la réservation existe
    const reservation = await prisma.reservation.findFirst({
      where: { userId, stageId: fromStageId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // 2. Vérifier que le stage destination a de la place
    const stageDest = await prisma.stage.findUnique({ where: { id: toStageId } });
    if (!stageDest || stageDest.PlaceDisponibles <= 0) {
      return NextResponse.json({ error: "Pas de place dans le stage cible" }, { status: 400 });
    }

    // 3. Mettre à jour la réservation
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stageId: toStageId },
    });

    // 4. Mettre à jour les places disponibles (facultatif selon ton modèle)
    await prisma.stage.update({
      where: { id: fromStageId },
      data: { PlaceDisponibles: { increment: 1 } },
    });

    await prisma.stage.update({
      where: { id: toStageId },
      data: { PlaceDisponibles: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur déplacement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
