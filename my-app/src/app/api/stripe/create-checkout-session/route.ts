// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Assure-toi d'avoir bien défini ta clé secrète dans .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  try {
    const { stageId, stageTitle, stagePrice, userId, typeStage } = await request.json();
    
    // Validation des données requises
    if (!stageId || !stageTitle || !stagePrice || !userId || !typeStage) {
      return NextResponse.json(
        { error: "Tous les paramètres sont requis, y compris le type de stage" },
        { status: 400 }
      );
    }

    // Crée une session de paiement
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: stageTitle,
              description: `Type: ${formatTypeStage(typeStage)}`,
            },
            unit_amount: Math.round(stagePrice * 100), // en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Réussite et annulation — personnalise ces URLs si besoin
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/${stageId}`,
      metadata: {
        userId: String(userId),
        stageId: String(stageId),
        typeStage: typeStage,
        paymentMethod: "card",
        paid : "true",
      },
    });
    
    console.log("Session créée:", {
      userId, 
      stageId,
      typeStage,
      sessionId: session.id
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session Stripe" },
      { status: 500 }
    );
  }
}

// Fonction helper pour formater le type de stage dans la description du produit
function formatTypeStage(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire"
  };
  
  return types[type] || type;
}