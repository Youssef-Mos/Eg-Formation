// app/api/reservation/deplacer-resa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";
//import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

// Validateur pour les données de déplacement
const isValidMoveData = (data: any): data is { userId: number; fromStageId: number; toStageId: number } => {
  return (
    typeof data === "object" &&
    typeof data.userId === "number" && data.userId > 0 &&
    typeof data.fromStageId === "number" && data.fromStageId > 0 &&
    typeof data.toStageId === "number" && data.toStageId > 0 &&
    data.fromStageId !== data.toStageId
  );
};

// Fonction pour générer l'attestation PDF (similaire à celle utilisée pour validate-payment)
/*async function generateReservationPDF(stage: any, user: any, typeStage: string): Promise<Buffer> {
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

      doc.fontSize(20).text("Attestation de stage - Modification", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text("Changement de date de stage", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Participant : ${user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : user.email}`);
      doc.text(`Stage : ${stage.Titre}`);
      doc.text(`Type de stage : ${formatTypeStage(typeStage)}`);
      doc.text(`Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}`);
      doc.text(`Dates : du ${new Date(stage.DateDebut).toLocaleDateString()} au ${new Date(stage.DateFin).toLocaleDateString()}`);
      doc.text(`Heures : ${stage.HeureDebut} - ${stage.HeureFin}`);
      doc.moveDown();
      doc.text("Votre réservation a été déplacée vers ce nouveau stage. Cette attestation confirme votre inscription.");
      doc.end();
    } catch (err) {
      console.error("Exception pendant l'écriture du PDF :", err);
      reject(err);
    }
  });
}

// Fonction pour formater le type de stage (utilisée dans le PDF)
function formatTypeStage(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire",
    "stage": "Stage standard"
  };
  
  return types[type] || type;
}
*/
// Fonction pour envoyer l'email avec l'attestation
async function sendEmailNotification(email: string, userName: string, oldStage: any, newStage: any, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  await transporter.sendMail({
    from: `"EG-Formation" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Modification de votre réservation de stage",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Modification de votre réservation</h1>
        <p>Bonjour ${userName},</p>
        <p>Nous vous informons que votre réservation pour le stage initialement prévu le ${new Date(oldStage.DateDebut).toLocaleDateString()} à ${oldStage.Ville} a été déplacée vers un nouveau stage.</p>
        
        <h2 style="color: #333; margin-top: 20px;">Détails du nouveau stage :</h2>
        <ul>
          <li><strong>Titre :</strong> ${newStage.Titre}</li>
          <li><strong>Dates :</strong> ${new Date(newStage.DateDebut).toLocaleDateString()} au ${new Date(newStage.DateFin).toLocaleDateString()}</li>
          <li><strong>Horaires :</strong> ${newStage.HeureDebut} - ${newStage.HeureFin}</li>
          <li><strong>Adresse :</strong> ${newStage.Adresse}, ${newStage.CodePostal} ${newStage.Ville}</li>
        </ul>
        
        <p>Vous trouverez ci-joint votre nouvelle attestation de réservation.</p>
        <p>Cette modification n'affecte pas votre statut de paiement. Vous pouvez également télécharger cette attestation depuis votre espace personnel sur notre site.</p>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        
        <p style="margin-top: 30px;">Cordialement,</p>
        <p><strong>L'équipe EG-Formation</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: "nouvelle_attestation.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData(request, isValidMoveData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_MOVE_DATA");
    return error;
  }

  const { userId, fromStageId, toStageId } = data!;
  
  try {
    // 1. Récupérer la réservation avec tous ses détails
    const reservation = await prisma.reservation.findFirst({
      where: { userId, stageId: fromStageId },
      include: { user: true }
    });
    
    if (!reservation) {
      logApiAccess(request, session, false, "RESERVATION_NOT_FOUND");
      return NextResponse.json(
        { error: "Réservation non trouvée", code: "RESERVATION_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    // 2. Récupérer les détails des deux stages
    const [fromStage, toStage] = await Promise.all([
      prisma.stage.findUnique({ where: { id: fromStageId } }),
      prisma.stage.findUnique({ where: { id: toStageId } })
    ]);
    
    if (!fromStage || !toStage) {
      logApiAccess(request, session, false, "STAGE_NOT_FOUND");
      return NextResponse.json(
        { error: "Stage non trouvé", code: "STAGE_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    if (toStage.PlaceDisponibles <= 0) {
      logApiAccess(request, session, false, "NO_PLACES_AVAILABLE");
      return NextResponse.json(
        { error: "Pas de place dans le stage cible", code: "NO_PLACES_AVAILABLE" },
        { status: 400 }
      );
    }
    
    // 3. Mettre à jour la réservation
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stageId: toStageId }
    });
    
    // 4. Mettre à jour les places disponibles
    await Promise.all([
      prisma.stage.update({
        where: { id: fromStageId },
        data: { PlaceDisponibles: { increment: 1 } }
      }),
      prisma.stage.update({
        where: { id: toStageId },
        data: { PlaceDisponibles: { decrement: 1 } }
      })
    ]);
    
    // 5. Générer et envoyer l'attestation
    /*try {
      const pdfBuffer = await generateReservationPDF(toStage, reservation.user, reservation.TypeStage);
      const userName = reservation.user.firstName || reservation.user.lastName 
        ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
        : reservation.user.email;
      
      await sendEmailNotification(reservation.user.email, userName, fromStage, toStage, pdfBuffer);
      console.log(`Email de notification envoyé à ${reservation.user.email}`);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
    }*/
    
    logApiAccess(request, session, true);
    return NextResponse.json({ 
      success: true,
      message: "Réservation déplacée avec succès et client notifié par email"
    });
  } catch (error) {
    console.error("Erreur déplacement:", error);
    logApiAccess(request, session, false, "MOVE_FAILED");
    return NextResponse.json(
      { error: "Erreur serveur", code: "MOVE_FAILED" },
      { status: 500 }
    );
  }
});