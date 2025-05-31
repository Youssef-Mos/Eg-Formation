// app/api/invoice/request/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour demander une facture" },
      { status: 401 }
    );
  }

  try {
    const { reservationId, message } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de réservation requis" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation appartient à l'utilisateur
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: parseInt(reservationId),
        userId: parseInt(session.user.id)
      },
      include: {
        stage: true,
        user: true
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si une facture existe déjà
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        reservationId: parseInt(reservationId)
      }
    });

    // Configurer l'email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    });

    const emailContent = `
Nouvelle demande de facture

Un client demande sa facture pour la réservation suivante :

👤 Client : ${reservation.user.firstName} ${reservation.user.lastName}
📧 Email : ${reservation.user.email}
🎯 Stage : ${reservation.stage.Titre}
📍 Lieu : ${reservation.stage.Ville}
📅 Date : ${new Date(reservation.stage.DateDebut).toLocaleDateString('fr-FR')}
💰 Montant : ${reservation.stage.Prix}€
🆔 Réservation ID : ${reservation.id}
📋 Statut : ${existingInvoice ? 'Facture déjà émise' : 'Facture à créer'}

${message ? `Message du client : "${message}"` : ''}

${existingInvoice 
  ? `⚠️ Une facture existe déjà (N° ${existingInvoice.invoiceNumber}). Le client souhaite peut-être la recevoir à nouveau.`
  : '📝 Aucune facture n\'a encore été émise pour cette réservation.'
}

Accédez à votre interface d'administration pour traiter cette demande :
${process.env.NEXTAUTH_URL}/admin/factures

---
Demande envoyée le ${new Date().toLocaleString('fr-FR')}
    `;

    await transporter.sendMail({
      from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.MAIL_USER,
      subject: `Demande de facture - ${reservation.user.firstName} ${reservation.user.lastName}`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });

    console.log("✅ Demande de facture envoyée à l'admin pour la réservation:", reservationId);

    return NextResponse.json({
      message: "Votre demande de facture a été envoyée à notre équipe. Vous recevrez votre facture par email sous 24h.",
      reservationId: reservation.id
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la demande de facture:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la demande" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}