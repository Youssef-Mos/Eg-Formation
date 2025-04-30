import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from '@prisma/client';
import { buffer } from "micro"; // Installe micro si nécessaire

const prisma = new PrismaClient();
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!; // À copier depuis Stripe dashboard

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Session Metadata:", session.metadata);

    const userId = Number(session.metadata?.userId);
    const stageId = Number(session.metadata?.stageId);

    if (!userId || !stageId) {
      console.error("User ID ou Stage ID manquant dans les metadata Stripe");
      return new NextResponse("Missing metadata", { status: 400 });
    }

    try {
      // Vérifie si la réservation existe déjà
      const existingReservation = await prisma.reservation.findUnique({
        where: {
          userId_stageId: {
            userId,
            stageId,
          },
        },
      });

      if (!existingReservation) {
        await prisma.reservation.create({
          data: {
            userId,
            stageId,
          },
        });
        console.log("Réservation ajoutée en base de données ✅");
      }
    } catch (error) {
      console.error("Erreur lors de l'insertion en base de données", error);
      return new NextResponse("Database Error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}
