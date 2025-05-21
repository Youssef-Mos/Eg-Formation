// app/api/reservation/details/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function GET(request: Request) {
  console.log("🔍 API details appelée");
  
  const session = await getServerSession(authOptions);
  console.log("Session utilisateur:", session?.user);
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour accéder à cette ressource" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const reservationId = searchParams.get('reservation_id');
  
  console.log("Paramètres:", { sessionId, reservationId });

  if (!sessionId && !reservationId) {
    return NextResponse.json(
      { error: "Paramètre session_id ou reservation_id requis" },
      { status: 400 }
    );
  }

  try {
    // Si nous avons un sessionId Stripe, essayons d'abord de récupérer les informations depuis Stripe
    if (sessionId) {
      console.log("Récupération des informations de session Stripe:", sessionId);
      
      let stripeSession;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("Session Stripe récupérée:", stripeSession.id);
      } catch (stripeErr) {
        console.error("Erreur lors de la récupération de la session Stripe:", stripeErr);
        return NextResponse.json(
          { error: "Session Stripe introuvable" },
          { status: 404 }
        );
      }
      
      const stageId = stripeSession.metadata?.stageId ? Number(stripeSession.metadata.stageId) : null;
      const userId = stripeSession.metadata?.userId ? Number(stripeSession.metadata.userId) : null;
      const typeStageCode = stripeSession.metadata?.typeStage || "stage";
      
      console.log("Metadata de session:", { stageId, userId, typeStageCode });
      
      if (!stageId || !userId) {
        return NextResponse.json(
          { error: "Informations insuffisantes dans la session Stripe" },
          { status: 400 }
        );
      }
      
      // Trouver la réservation correspondante
      const reservation = await prisma.reservation.findUnique({
        where: {
          userId_stageId: { userId, stageId }
        }
      });
      
      if (!reservation) {
        console.log("Aucune réservation trouvée. Création d'une réservation temporaire pour l'affichage.");
        
        // Si pas de réservation, récupérer quand même les données pour l'affichage
        const [user, stage] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.stage.findUnique({ where: { id: stageId } })
        ]);
        
        if (!user || !stage) {
          return NextResponse.json(
            { error: "Utilisateur ou stage introuvable" },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          stage,
          user,
          paymentMethod: "card",
          paid: true,
          typeStage: {
            code: typeStageCode,
            formatted: formatTypeStage(typeStageCode)
          },
          session: { id: sessionId }
        });
      }
      
      // Trouver le stage et l'utilisateur
      const [user, stage] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.stage.findUnique({ where: { id: stageId } })
      ]);
      
      if (!user || !stage) {
        return NextResponse.json(
          { error: "Utilisateur ou stage introuvable" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        stage,
        user,
        paymentMethod: reservation.paymentMethod || "card",
        paid: true,
        typeStage: {
          code: reservation.TypeStage,
          formatted: formatTypeStage(reservation.TypeStage)
        },
        session: { id: sessionId }
      });
    }
    
    // Si nous avons un ID de réservation
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: Number(reservationId) }
      });
      
      if (!reservation) {
        return NextResponse.json(
          { error: "Réservation introuvable" },
          { status: 404 }
        );
      }
      
      // Vérifier que l'utilisateur est le propriétaire
      if (reservation.userId !== Number(session.user.id)) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à accéder à cette réservation" },
          { status: 403 }
        );
      }
      
      const [user, stage] = await Promise.all([
        prisma.user.findUnique({ where: { id: reservation.userId } }),
        prisma.stage.findUnique({ where: { id: reservation.stageId } })
      ]);
      
      if (!user || !stage) {
        return NextResponse.json(
          { error: "Utilisateur ou stage introuvable" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        stage,
        user,
        paymentMethod: reservation.paymentMethod || "card",
        paid: reservation.paid !== false,
        typeStage: {
          code: reservation.TypeStage,
          formatted: formatTypeStage(reservation.TypeStage)
        },
        session: null
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des détails" },
      { status: 500 }
    );
  }
}

// Fonction pour formater le type de stage
function formatTypeStage(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire",
    "stage": "Stage standard"
  };
  
  return types[type] || type;
}