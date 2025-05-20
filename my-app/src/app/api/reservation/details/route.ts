// app/api/reservation/details/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Fonction helper pour formater le type de stage
function formatTypeStage(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire"
  };
  
  return types[type] || type;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID manquant" }, { status: 400 });
  }

  try {
    // 1. Récupérer les données de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || !session.metadata) {
      return NextResponse.json({ error: "Session non trouvée ou sans métadonnées" }, { status: 404 });
    }
    
    const userId = Number(session.metadata.userId);
    const stageId = Number(session.metadata.stageId);
    const typeStage = session.metadata.typeStage || "stage";
    
    // 2. Récupérer les détails du stage
    const stage = await prisma.stage.findUnique({
      where: { id: stageId }
    });
    
    if (!stage) {
      return NextResponse.json({ error: "Stage non trouvé" }, { status: 404 });
    }
    
    // 3. Récupérer les détails de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        // Ne pas inclure de données sensibles comme le mot de passe
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    
    // 4. Récupérer la réservation
    const reservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: { userId, stageId }
      }
    });
    
    // 5. Retourner toutes les données
    return NextResponse.json({
      session: {
        id: sessionId,
        amount_total: session.amount_total ? session.amount_total / 100 : null,
        payment_status: session.payment_status,
      },
      reservation: reservation,
      stage: stage,
      typeStage: {
        code: typeStage,
        formatted: formatTypeStage(typeStage)
      },
      user: user,
    });
    
  } catch (error: any) {
    console.error("Erreur lors de la récupération des détails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}