// app/api/reservation/user-stage/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust this path based on where your authOptions is defined

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  console.log("Session in API:", session?.user); // Log for debugging
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour accéder à cette ressource" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json(
      { error: "ID utilisateur non trouvé dans la session" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  
  if (!stageId) {
    return NextResponse.json(
      { error: "L'identifiant du stage est requis" },
      { status: 400 }
    );
  }

  try {
    console.log(`Recherche de réservation pour userId: ${userId}, stageId: ${stageId}`);
    
    // Find the reservation for this user and stage
    const reservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId: Number(userId),
          stageId: Number(stageId)
        }
      }
    });

    if (!reservation) {
      console.log("Aucune réservation trouvée");
      return NextResponse.json(
        { error: "Aucune réservation trouvée pour ce stage" },
        { status: 404 }
      );
    }

    console.log("Réservation trouvée:", reservation);
    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de la réservation" },
      { status: 500 }
    );
  }
}