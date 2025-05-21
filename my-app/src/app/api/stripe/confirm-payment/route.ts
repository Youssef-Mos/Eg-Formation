// app/api/stripe/confirm-payment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil", // Utilisez la même version que dans votre webhook
});

export async function POST(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour confirmer un paiement" },
      { status: 401 }
    );
  }

  try {
    // Récupérer les données de la requête
    const { sessionId, reservationId } = await request.json();

    if (!sessionId || !reservationId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Vérifier la session Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Le paiement n'a pas été effectué" },
        { status: 400 }
      );
    }
    
    // Récupérer la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: { user: true, stage: true }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire de la réservation
    if (reservation.userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à mettre à jour cette réservation" },
        { status: 403 }
      );
    }

    // Mettre à jour la réservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: Number(reservationId) },
      data: {
        paymentMethod: "card",
        paid: true
      }
    });

    console.log("Réservation mise à jour avec paiement par carte:", updatedReservation);

    // Générer PDF et envoyer email si vous avez cette fonctionnalité
    try {
      if (reservation.user && reservation.user.email && reservation.stage) {
        console.log("Envoi de l'email de confirmation après mise à jour du paiement...");
        
        // Import dynamique des fonctions de votre webhook
        const { generateReservationPDF, sendConfirmationEmail } = await import('../../webhook/utils');
        
        const pdf = await generateReservationPDF(reservation.stage, reservation.user.email);
        await sendConfirmationEmail(reservation.user.email, pdf);
        
        console.log("Email envoyé à", reservation.user.email);
      }
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas échouer le processus à cause d'une erreur d'email
    }

    return NextResponse.json({
      success: true,
      message: "Paiement confirmé et réservation mise à jour"
    });
  } catch (error) {
    console.error("Erreur lors de la confirmation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la confirmation du paiement" },
      { status: 500 }
    );
  }
}