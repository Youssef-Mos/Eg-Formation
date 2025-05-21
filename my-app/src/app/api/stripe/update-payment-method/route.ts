// app/api/stripe/update-payment-method/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil", // ou la version que vous utilisez
});

export async function POST(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour effectuer un paiement" },
      { status: 401 }
    );
  }

  try {
    // Récupérer les données de la requête
    const { reservationId, stageId, stageTitle, stagePrice, userId, typeStage } = await request.json();

    // Vérifications de base
    if (!reservationId || !stageId || !stageTitle || !stagePrice || !userId || !typeStage) {
      return NextResponse.json(
        { error: "Données de paiement incomplètes" },
        { status: 400 }
      );
    }

    // Vérifier que l'ID utilisateur est cohérent avec la session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "ID utilisateur non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }
    
    // Vérifier que la réservation correspond bien au stageId et à l'userId
    if (reservation.stageId !== Number(stageId) || reservation.userId !== Number(userId)) {
      return NextResponse.json(
        { error: "La réservation ne correspond pas aux paramètres fournis" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation n'est pas déjà payée
    if (reservation.paid === true) {
      return NextResponse.json(
        { error: "Cette réservation est déjà payée" },
        { status: 400 }
      );
    }

    // Créer une session de paiement Stripe
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Créer la session de paiement Stripe
const stripeSession = await stripe.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: "eur",
        product_data: {
          name: `${stageTitle} - ${typeStage}`,
          description: `Réservation pour le stage du ${new Date(reservation.createdAt).toLocaleDateString("fr-FR")}`,
        },
        unit_amount: stagePrice * 100, // Stripe utilise les centimes
      },
      quantity: 1,
    },
  ],
  mode: "payment",
  success_url: `${origin}/reservation/success?session_id={CHECKOUT_SESSION_ID}&reservationId=${reservationId}`,
  cancel_url: `${origin}/stage/${stageId}`,
  customer_email: user.email || undefined,
  client_reference_id: String(reservationId),
  metadata: {
    reservationId: String(reservationId),
    stageId: String(stageId),
    userId: String(userId),
    typeStage: typeStage
  },
});

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session de paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}