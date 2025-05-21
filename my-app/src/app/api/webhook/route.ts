// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// IMPORTANT: Cette configuration pour Next.js App Router
export async function POST(request: Request) {
  console.log("🔄 Webhook reçu"); // Log pour vérifier si la route est appelée
  
  // Récupérer la signature et le corps brut
  const signature = request.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("❌ Signature Stripe manquante");
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }
  
  try {
    // Récupérer le corps brut de la requête
    const body = await request.text();
    
    // Vérifier la signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );
    
    console.log("✅ Événement Stripe validé:", event.type);
    
    // Traiter l'événement
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("📦 Session Stripe complétée:", session.id);
      console.log("📦 Session metadata:", session.metadata);
      
      const typeStage = session.metadata?.typeStage || "stage";
      const userId = session.metadata?.userId ? Number(session.metadata.userId) : null;
      const stageId = session.metadata?.stageId ? Number(session.metadata.stageId) : null;
      const reservationId = session.metadata?.reservationId ? Number(session.metadata.reservationId) : null;
      
      if (!userId || !stageId) {
        console.error("❌ Metadata manquante dans Stripe session");
        return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
      }
      
      // Votre logique de traitement ici...
      // Création ou mise à jour de la réservation
      
      // Pour débuter, créons simplement la réservation
      if (reservationId) {
        // Mise à jour du mode de paiement
        await prisma.reservation.update({
          where: { id: reservationId },
          data: {
            paymentMethod: "card",
            paid: true
          }
        });
        console.log("✅ Mode de paiement mis à jour pour la réservation:", reservationId);
      } else {
        const existingReservation = await prisma.reservation.findUnique({
          where: {
            userId_stageId: { userId, stageId }
          }
        });

        if (!existingReservation) {
          // Créer une nouvelle réservation
          const newReservation = await prisma.reservation.create({
            data: {
              userId,
              stageId,
              TypeStage: typeStage,
              paymentMethod: "card",
              paid: true
            }
          });
          console.log("✅ Nouvelle réservation créée:", newReservation.id);

          // Mettre à jour le nombre de places
          await prisma.stage.update({
            where: { id: stageId },
            data: {
              PlaceDisponibles: {
                decrement: 1
              }
            }
          });
        } else {
          // Mettre à jour la réservation existante
          await prisma.reservation.update({
            where: { id: existingReservation.id },
            data: {
              paymentMethod: "card",
              paid: true
            }
          });
          console.log("✅ Réservation existante mise à jour:", existingReservation.id);
        }
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur webhook:", err);
    return NextResponse.json(
      { error: "Erreur de validation webhook" },
      { status: 400 }
    );
  }
}