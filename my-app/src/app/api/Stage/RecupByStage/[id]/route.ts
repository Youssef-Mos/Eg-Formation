import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
    const { id } = await params;
  const stageId = Number(id);

  // Validation de l'ID
  if (isNaN(stageId)) {
    return NextResponse.json(
      { error: 'Identifiant de stage invalide.' },
      { status: 400 }
    );
  }

  try {
    // Récupérer le stage avec ses réservations et profils utilisateurs
    const stageWithReservations = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        reservations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Si le stage n'existe pas
    if (!stageWithReservations) {
      return NextResponse.json(
        { error: `Stage avec l'id ${stageId} non trouvé.` },
        { status: 404 }
      );
    }

    // Toujours renvoyer 200, même si aucun enregistrement dans reservations
    return NextResponse.json(stageWithReservations, { status: 200 });
  } catch (error) {
    console.error('Erreur API RecupStageByID:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du stage.' },
      { status: 500 }
    );
  }
}
