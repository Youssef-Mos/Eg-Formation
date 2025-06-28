// app/api/reservation/create-without-payment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour effectuer une réservation" },
      { status: 401 }
    );
  }

  try {
    // Récupérer les données de la requête
    const { stageId, userId, typeStage, paymentMethod } = await request.json();

    // Vérifications de base
    if (!stageId || !userId || !typeStage || !paymentMethod) {
      return NextResponse.json(
        { error: "Données de réservation incomplètes" },
        { status: 400 }
      );
    }

    // Vérifier que l'ID utilisateur est cohérent avec la session
    if (userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "ID utilisateur non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier les places disponibles
    const stage = await prisma.stage.findUnique({
      where: { id: Number(stageId) }
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage non trouvé" },
        { status: 404 }
      );
    }

    if (stage.PlaceDisponibles <= 0) {
      return NextResponse.json(
        { error: "Plus de places disponibles pour ce stage" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà réservé ce stage
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId: Number(userId),
          stageId: Number(stageId)
        }
      }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "Vous avez déjà réservé ce stage" },
        { status: 400 }
      );
    }

    // Créer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(userId),
        stageId: Number(stageId),
        TypeStage: typeStage,
        paymentMethod: paymentMethod,
        paid: false // Paiement pas encore effectué
      }
    });

    // Mettre à jour le nombre de places disponibles
    await prisma.stage.update({
      where: { id: Number(stageId) },
      data: {
        PlaceDisponibles: stage.PlaceDisponibles - 1
      }
    });

    return NextResponse.json({
      success: true,
      message: "Réservation créée avec succès",
      reservation
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la réservation" },
      { status: 500 }
    );
  }
}