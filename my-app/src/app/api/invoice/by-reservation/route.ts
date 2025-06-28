// app/api/invoice/by-reservation/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour accéder aux factures" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const reservationId = url.searchParams.get("reservationId");

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de réservation requis" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation appartient à l'utilisateur connecté
    const reservation = await prisma.reservation.findUnique({
      where: { 
        id: parseInt(reservationId),
        userId: parseInt(session.user.id)
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la facture associée à cette réservation
    const invoice = await prisma.invoice.findFirst({
      where: { 
        reservationId: parseInt(reservationId),
        userId: parseInt(session.user.id)
      },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        // Exclure pdfData pour la performance
      },
      orderBy: { createdAt: 'desc' } // Prendre la facture la plus récente
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée pour cette réservation" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);

  } catch (error) {
    console.error("Erreur lors de la récupération de la facture:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de la facture" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}