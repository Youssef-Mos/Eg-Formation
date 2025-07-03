// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { processInvoiceAfterPaymentAdmin } from "@/app/utils/invoiceGeneratorJSADMIN";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log("🔄 Webhook reçu");
  
  const signature = request.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("❌ Signature Stripe manquante");
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }
  
  try {
    const body = await request.text();
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );
    
    console.log("✅ Événement Stripe validé:", event.type);
    
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
      
      let finalReservationId = reservationId;
      
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
          finalReservationId = newReservation.id;

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
          finalReservationId = existingReservation.id;
        }
      }

      // Générer et envoyer la facture
      
      if (finalReservationId && session.payment_intent) {
        try {
          console.log("🧾 Génération de la facture...");
          
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id;
          
          const amount = session.amount_total || 0;
          const currency = session.currency || 'eur';
          
          const result = await processInvoiceAfterPaymentAdmin(
            finalReservationId,
            paymentIntentId,
            amount,
            currency.toUpperCase()
          );
          
          console.log("✅ Facture générée avec succès:", result.invoiceNumber);
        } catch (invoiceError) {
          console.error("❌ Erreur lors de la génération de la facture:", invoiceError);
          // Ne pas faire échouer le webhook à cause d'une erreur de facture
        }
      }

      // Envoyer l'email de confirmation (si vous avez cette fonction)
      try {
        const reservation = await prisma.reservation.findUnique({
          where: { id: finalReservationId! },
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
                Adresse: true,
                CodePostal: true,
                Ville: true,
                DateDebut: true,
                DateFin: true,
                HeureDebut: true,
                HeureFin: true,
                HeureDebut2: true,
                HeureFin2: true,
                Prix: true,
                NumeroStage: true
              }
            }
          }
        });

        if (reservation?.user?.email && reservation?.stage) {
          console.log("📧 Envoi de l'email de confirmation...");
          
          // Import dynamique de la fonction d'envoi d'email si elle existe
          try {
            const { sendConfirmationEmail } = await import('@/app/utils/convocationGeneratorJsPDF');
            
            function mapStageTypeToNumber(typeStage: string): 1 | 2 | 3 | 4 {
              const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
                "recuperation_points": 1,
                "permis_probatoire": 2,
                "alternative_poursuites": 3,
                "peine_complementaire": 4
              };
              return typeMapping[typeStage] || 1;
            }

            await sendConfirmationEmail(
              reservation.user,
              reservation.stage,
              { stageType: mapStageTypeToNumber(typeStage) }
            );
            
            console.log("✅ Email de confirmation envoyé");
          } catch (utilsError) {
            console.log("ℹ️ Fonction sendConfirmationEmail non disponible, email non envoyé");
          }
        }
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de confirmation:", emailError);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur webhook:", err);
    return NextResponse.json(
      { error: "Erreur de validation webhook" },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}