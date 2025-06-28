// app/api/invoice/download/route.ts
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
      { error: "Vous devez être connecté pour télécharger une facture" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");
    const reservationId = url.searchParams.get("reservationId");

    if (!invoiceId && !reservationId) {
      return NextResponse.json(
        { error: "ID de facture ou de réservation requis" },
        { status: 400 }
      );
    }

console.log("Recherche facture avec :", {
  invoiceId,
  reservationId,
  userId: session.user.id,
});

    let invoice;

    if (invoiceId) {
      // Rechercher par ID de facture
      invoice = await prisma.invoice.findUnique({
        where: { 
          id: parseInt(invoiceId),
          userId: parseInt(session.user.id) // Vérifier que la facture appartient à l'utilisateur
        }
      });
    } else if (reservationId) {
      // Rechercher par ID de réservation
      invoice = await prisma.invoice.findFirst({
        where: { 
          reservationId: parseInt(reservationId),
          userId: parseInt(session.user.id)
        },
        orderBy: { createdAt: 'desc' } // Prendre la facture la plus récente
      });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    if (!invoice.pdfData) {
      return NextResponse.json(
        { error: "PDF de la facture non disponible" },
        { status: 404 }
      );
    }

    // Créer la réponse avec le PDF
    const pdfBuffer = Buffer.from(invoice.pdfData as Uint8Array);
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture_${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      }
    });

    return response;

  } catch (error) {
    console.error("Erreur lors du téléchargement de la facture:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du téléchargement" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}