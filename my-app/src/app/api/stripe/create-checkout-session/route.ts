// app/api/stripe/create-checkout-session/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Assure-toi d'avoir bien défini ta clé secrète dans .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  try {
    const { stageId, stageTitle, stagePrice } = await request.json();
    
    // Crée une session de paiement
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: stageTitle,
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
