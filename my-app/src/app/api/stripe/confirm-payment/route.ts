// app/api/stripe/confirm-payment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
// import { processInvoiceAfterPayment } from "@/app/utils/invoiceGeneratorJsPDF"; // DÉSACTIVÉ

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour confirmer un paiement" },
      { status: 401 }
    );
  }

  try {
    const { sessionId, reservationId, stageType = "recuperation_points" } = await request.json();
    
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

    // Récupérer la réservation avec toutes les données nécessaires
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

    // ❌ GÉNÉRATION DE FACTURE DÉSACTIVÉE
    // let invoiceResult = null;
    // try {
    //   console.log("🧾 Génération de la facture...");
    //   
    //   const paymentIntentId = typeof stripeSession.payment_intent === 'string' 
    //     ? stripeSession.payment_intent 
    //     : stripeSession.payment_intent?.id || sessionId;
    //   
    //   const amount = stripeSession.amount_total || (reservation.stage!.Prix * 100);
    //   const currency = stripeSession.currency || 'eur';
    //   
    //   invoiceResult = await processInvoiceAfterPayment(
    //     Number(reservationId),
    //     paymentIntentId,
    //     amount,
    //     currency.toUpperCase()
    //   );
    //   
    //   console.log("✅ Facture générée avec succès:", invoiceResult.invoiceNumber);
    // } catch (invoiceError) {
    //   console.error("❌ Erreur lors de la génération de la facture:", invoiceError);
    //   // Ne pas faire échouer le processus à cause d'une erreur de facture
    // }

    // Envoyer l'email de confirmation
    try {
      if (reservation.user && reservation.user.email && reservation.stage) {
        console.log("Envoi de l'email de confirmation après mise à jour du paiement...");
        
        // Import dynamique des fonctions de votre webhook
        const { sendConfirmationEmail } = await import('@/app/utils/convocationGeneratorJsPDF');
        
        // Mapper le type de stage string vers number
        function mapStageTypeToNumber(typeStage: string): 1 | 2 | 3 | 4 {
          const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
            "recuperation_points": 1,
            "permis_probatoire": 2,
            "alternative_poursuites": 3,
            "peine_complementaire": 4
          };
          return typeMapping[typeStage] || 1;
        }

        const stageData = {
          id: reservation.stage.id,
          Titre: reservation.stage.Titre,
          Adresse: reservation.stage.Adresse,
          CodePostal: reservation.stage.CodePostal,
          Ville: reservation.stage.Ville,
          DateDebut: reservation.stage.DateDebut,
          DateFin: reservation.stage.DateFin,
          HeureDebut: reservation.stage.HeureDebut,
          HeureFin: reservation.stage.HeureFin,
          HeureDebut2: reservation.stage.HeureDebut2,
          HeureFin2: reservation.stage.HeureFin2,
          Prix: reservation.stage.Prix,
          NumeroStage: reservation.stage.NumeroStage
        };

        const userData = {
          id: reservation.user.id,
          firstName: reservation.user.firstName,
          lastName: reservation.user.lastName,
          email: reservation.user.email
        };

        const reservationOptions = {
          stageType: mapStageTypeToNumber(stageType)
        };

        await sendConfirmationEmail(userData, stageData, reservationOptions);
        console.log("Email envoyé à", reservation.user.email);
      }
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Paiement confirmé et réservation mise à jour",
      reservationId: updatedReservation.id
      // invoiceNumber et invoiceId supprimés car génération de facture désactivée
    });

  } catch (error) {
    console.error("Erreur lors de la confirmation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la confirmation du paiement" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}