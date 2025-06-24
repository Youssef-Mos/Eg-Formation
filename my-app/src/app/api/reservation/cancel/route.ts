// app/api/reservation/cancel/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour annuler une réservation" },
      { status: 401 }
    );
  }

  try {
    const { reservationId, isAdmin = false } = await request.json();
    
    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de réservation manquant" },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: { 
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }, 
        stage: {
          select: {
            id: true,
            Titre: true,
            PlaceDisponibles: true
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les autorisations
    if (!isAdmin && reservation.userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à annuler cette réservation" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation n'est pas payée
    if (reservation.paid) {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation déjà payée" },
        { status: 400 }
      );
    }

    // Supprimer la réservation et mettre à jour les places disponibles
    await prisma.$transaction(async (tx) => {
      // Supprimer la réservation
      await tx.reservation.delete({
        where: { id: Number(reservationId) }
      });

      // Remettre une place disponible
      await tx.stage.update({
        where: { id: reservation.stageId },
        data: {
          PlaceDisponibles: {
            increment: 1
          }
        }
      });
    });

    console.log(`Réservation ${reservationId} annulée avec succès`);

    return NextResponse.json({
      success: true,
      message: "Réservation annulée avec succès",
      reservationId: Number(reservationId)
    });

  } catch (error) {
    console.error("Erreur lors de l'annulation de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'annulation de la réservation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}