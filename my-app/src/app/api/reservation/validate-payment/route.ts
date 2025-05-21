// app/api/reservation/validate-payment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

// Fonction pour générer le PDF d'attestation
async function generateReservationPDF(stage: any, userEmail: string): Promise<Buffer> {
  const fontPath = process.env.NEXT_PUBLIC_PDF_FONT_PATH || "public/fonts/OpenSansHebrew-Light.ttf";

  const doc = new PDFDocument({
    autoFirstPage: false,
    font: fontPath
  });

  const chunks: any[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    try {
      doc.registerFont("OpenSans", fontPath);
      doc.addPage();
      doc.font("OpenSans");

      doc.fontSize(20).text("Confirmation de réservation", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text("Paiement confirmé", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Stage : ${stage.Titre}`);
      doc.text(`Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}`);
      doc.text(`Dates : du ${new Date(stage.DateDebut).toLocaleDateString()} au ${new Date(stage.DateFin).toLocaleDateString()}`);
      doc.text(`Heures : ${stage.HeureDebut} - ${stage.HeureFin}`);
      doc.text(`Prix : ${stage.Prix} €`);
      doc.text(`Email participant : ${userEmail}`);
      doc.moveDown();
      doc.text("Votre paiement a été validé. Cette attestation confirme votre inscription définitive.");
      doc.end();
    } catch (err) {
      console.error("Exception pendant l'écriture du PDF :", err);
      reject(err);
    }
  });
}

// Fonction pour envoyer l'email avec l'attestation
async function sendPaymentConfirmationEmail(email: string, userName: string, stageName: string, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  await transporter.sendMail({
    from: `"Eg-Formation" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirmation de paiement pour votre stage",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Paiement Confirmé</h1>
        <p>Bonjour ${userName},</p>
        <p>Nous avons le plaisir de vous informer que votre paiement pour le stage <strong>${stageName}</strong> a été validé.</p>
        <p>Votre place est désormais confirmée. Vous trouverez en pièce jointe votre attestation de réservation.</p>
        <p>N'oubliez pas d'apporter cette attestation le jour du stage, ainsi que votre pièce d'identité et votre permis de conduire.</p>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <p style="margin-top: 30px;">Cordialement,</p>
        <p><strong>L'équipe Eg-Formation</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: "confirmation_paiement.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function POST(request: Request) {
  // Vérifier l'authentification et le rôle admin
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Non autorisé. Seuls les administrateurs peuvent valider les paiements." },
      { status: 403 }
    );
  }

  try {
    const { userId, stageId, reservationId } = await request.json();

    if (!userId || !stageId || !reservationId) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Récupérer les détails complets de la réservation, du stage et de l'utilisateur
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: {
        stage: true,
        user: true
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la réservation correspond bien à l'utilisateur et au stage
    if (reservation.userId !== Number(userId) || reservation.stageId !== Number(stageId)) {
      return NextResponse.json(
        { error: "Les informations de réservation ne correspondent pas" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut de paiement
    const updatedReservation = await prisma.reservation.update({
      where: { id: Number(reservationId) },
      data: { paid: true }
    });

    // Préparer et envoyer l'email avec attestation
    try {
      console.log("Génération du PDF pour la confirmation de paiement...");
      const pdfBuffer = await generateReservationPDF(
        reservation.stage, 
        reservation.user.email
      );

      console.log("Envoi de l'email de confirmation de paiement...");
      await sendPaymentConfirmationEmail(
        reservation.user.email,
        `${reservation.user.firstName || ''} ${reservation.user.lastName || ''}`.trim() || reservation.user.email,
        reservation.stage.Titre,
        pdfBuffer
      );
      
      console.log("Email de confirmation envoyé avec succès à", reservation.user.email);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas bloquer la validation du paiement en cas d'erreur d'email
    }

    return NextResponse.json({
      success: true,
      message: "Paiement validé avec succès et email envoyé au client",
      reservation: updatedReservation
    });
  } catch (error) {
    console.error("Erreur lors de la validation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la validation du paiement" },
      { status: 500 }
    );
  }
}