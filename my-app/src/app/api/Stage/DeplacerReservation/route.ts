// ===== FICHIER 3: app/api/reservation/deplacer-resa/route.ts =====

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";
// ✅ IMPORT DES UTILS DE DATE
import { formatDateForEmail } from "@/app/utils/dateUtils";

const prisma3 = new PrismaClient();

const isValidMoveData = (data: any): data is { userId: number; fromStageId: number; toStageId: number } => {
  return (
    typeof data === "object" &&
    typeof data.userId === "number" && data.userId > 0 &&
    typeof data.fromStageId === "number" && data.fromStageId > 0 &&
    typeof data.toStageId === "number" && data.toStageId > 0 &&
    data.fromStageId !== data.toStageId
  );
};

function mapTypeStageToNumber2(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,
    "permis_probatoire": 2,
    "alternative_poursuites": 3,
    "peine_complementaire": 4
  };
  
  return typeMapping[typeStage] || 1;
}

// ✅ Fonction email avec dates corrigées
async function sendEmailNotification2(email: string, userName: string, oldStage: any, newStage: any, pdfBuffer: Buffer) {
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
    cc: process.env.MAIL_USER, // ✅ CC automatique
    subject: "Modification de votre réservation de stage",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Modification de votre réservation</h1>
        <p>Bonjour ${userName},</p>
        <p>Nous vous informons que votre réservation pour le stage initialement prévu le ${formatDateForEmail(oldStage.DateDebut)} à ${oldStage.Ville} a été déplacée vers un nouveau stage.</p>
        
        <h2 style="color: #333; margin-top: 20px;">Détails du nouveau stage :</h2>
        <ul>
          <li><strong>Titre :</strong> ${newStage.Titre}</li>
          <li><strong>Dates :</strong> ${formatDateForEmail(newStage.DateDebut)} au ${formatDateForEmail(newStage.DateFin)}</li>
          <li><strong>Horaires :</strong> ${newStage.HeureDebut}-${newStage.HeureFin} / ${newStage.HeureDebut2}-${newStage.HeureFin2}</li>
          <li><strong>Adresse :</strong> ${newStage.Adresse}, ${newStage.CodePostal} ${newStage.Ville}</li>
          <li><strong>Numéro de stage :</strong> ${newStage.NumeroStage}</li>
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
        filename: `nouvelle_convocation_stage_${newStage.NumeroStage}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export const POST3 = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData(request, isValidMoveData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_MOVE_DATA");
    return error;
  }

  const { userId, fromStageId, toStageId } = data!;
  
  try {
    const reservation = await prisma3.reservation.findFirst({
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
    
    const [fromStage, toStage] = await Promise.all([
      prisma3.stage.findUnique({ 
        where: { id: fromStageId },
        include: { agrement: true }
      }),
      prisma3.stage.findUnique({ 
        where: { id: toStageId },
        include: { agrement: true }
      })
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
    
    await prisma3.reservation.update({
      where: { id: reservation.id },
      data: { stageId: toStageId }
    });
    
    await Promise.all([
      prisma3.stage.update({
        where: { id: fromStageId },
        data: { PlaceDisponibles: { increment: 1 } }
      }),
      prisma3.stage.update({
        where: { id: toStageId },
        data: { PlaceDisponibles: { decrement: 1 } }
      })
    ]);
    
    // ✅ Génération PDF avec dates corrigées (generateReservationPDF gère déjà les dates)
    try {
      console.log(`📄 Génération PDF pour déplacement de réservation - User ${userId}, Stage ${toStageId}`);
      
      const stageData = {
        id: toStage.id,
        Titre: toStage.Titre,
        Adresse: toStage.Adresse,
        CodePostal: toStage.CodePostal,
        Ville: toStage.Ville,
        DateDebut: toStage.DateDebut,
        DateFin: toStage.DateFin,
        HeureDebut: toStage.HeureDebut,
        HeureFin: toStage.HeureFin,
        HeureDebut2: toStage.HeureDebut2,
        HeureFin2: toStage.HeureFin2,
        Prix: toStage.Prix,
        NumeroStage: toStage.NumeroStage,
        agrement: toStage.agrement
          ? {
              ...toStage.agrement,
              nomDepartement: toStage.agrement.nomDepartement ?? undefined
            }
          : null
      };

      const userData = {
        id: reservation.user.id,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        email: reservation.user.email
      };

      const reservationOptions = {
        stageType: mapTypeStageToNumber2(reservation.TypeStage)
      };

      const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
      
      console.log(`✅ PDF généré avec succès (${pdfBuffer.length} bytes)`);
      
      const userName = reservation.user.firstName || reservation.user.lastName 
        ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
        : reservation.user.email;
      
      await sendEmailNotification2(reservation.user.email, userName, fromStage, toStage, pdfBuffer);
      console.log(`✅ Email de notification envoyé à ${reservation.user.email} (CC: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error("❌ Erreur lors de la génération PDF ou envoi email:", emailError);
    }
    
    logApiAccess(request, session, true);
    return NextResponse.json({ 
      success: true,
      message: "Réservation déplacée avec succès et client notifié par email"
    });
    
  } catch (error) {
    console.error("❌ Erreur déplacement:", error);
    logApiAccess(request, session, false, "MOVE_FAILED");
    return NextResponse.json(
      { error: "Erreur serveur", code: "MOVE_FAILED" },
      { status: 500 }
    );
  } finally {
    await prisma3.$disconnect();
  }
});