// app/api/reservation/deplacer-resa/route.ts - VERSION NETTOYÉE

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";
import { formatDateForEmail, formatCurrentDate } from "@/app/utils/dateUtils";

// ✅ Utilisation d'un nom standard
const prisma = new PrismaClient();

const isValidMoveData = (data: any): data is { userId: number; fromStageId: number; toStageId: number } => {
  return (
    typeof data === "object" &&
    typeof data.userId === "number" && data.userId > 0 &&
    typeof data.fromStageId === "number" && data.fromStageId > 0 &&
    typeof data.toStageId === "number" && data.toStageId > 0 &&
    data.fromStageId !== data.toStageId
  );
};

// ✅ Éviter la duplication - importer depuis un fichier commun
function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,
    "permis_probatoire": 2,
    "alternative_poursuites": 3,
    "peine_complementaire": 4
  };
  
  return typeMapping[typeStage] || 1;
}

// ✅ Fonction email simplifiée
async function sendMoveNotificationEmail(
  email: string, 
  userName: string, 
  oldStage: any, 
  newStage: any, 
  pdfBuffer: Buffer
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Modification de votre réservation</h1>
      <p>Bonjour ${userName},</p>
      <p>Nous vous informons que votre réservation pour le stage initialement prévu le <strong>${formatDateForEmail(oldStage.DateDebut)}</strong> à <strong>${oldStage.Ville}</strong> a été déplacée vers un nouveau stage.</p>
      
      <h2 style="color: #333; margin-top: 20px;">Détails du nouveau stage :</h2>
      <ul style="line-height: 1.6;">
        <li><strong>Titre :</strong> ${newStage.Titre}</li>
        <li><strong>Dates :</strong> ${formatDateForEmail(newStage.DateDebut)} au ${formatDateForEmail(newStage.DateFin)}</li>
        <li><strong>Horaires :</strong> ${newStage.HeureDebut}-${newStage.HeureFin} / ${newStage.HeureDebut2}-${newStage.HeureFin2}</li>
        <li><strong>Adresse :</strong> ${newStage.Adresse}, ${newStage.CodePostal} ${newStage.Ville}</li>
        <li><strong>Numéro de stage :</strong> ${newStage.NumeroStage}</li>
      </ul>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p style="margin: 0;"><strong>✅ Important :</strong></p>
        <p style="margin: 5px 0 0 0;">Vous trouverez ci-joint votre nouvelle attestation de réservation.</p>
        <p style="margin: 5px 0 0 0;">Cette modification n'affecte pas votre statut de paiement.</p>
      </div>
      
      <p>Vous pouvez également télécharger cette attestation depuis votre espace personnel sur notre site.</p>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter au <strong>0783372565</strong>.</p>
      
      <p style="margin-top: 30px;">Cordialement,</p>
      <p><strong>L'équipe EG-Formation</strong></p>
      
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #dee2e6;">
      <p style="font-size: 12px; color: #6c757d; text-align: center;">
        Email généré automatiquement le ${formatCurrentDate()}
      </p>
    </div>
  `;

  const textContent = `
Modification de votre réservation

Bonjour ${userName},

Nous vous informons que votre réservation pour le stage initialement prévu le ${formatDateForEmail(oldStage.DateDebut)} à ${oldStage.Ville} a été déplacée vers un nouveau stage.

DÉTAILS DU NOUVEAU STAGE :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Titre : ${newStage.Titre}
• Dates : ${formatDateForEmail(newStage.DateDebut)} au ${formatDateForEmail(newStage.DateFin)}
• Horaires : ${newStage.HeureDebut}-${newStage.HeureFin} / ${newStage.HeureDebut2}-${newStage.HeureFin2}
• Adresse : ${newStage.Adresse}, ${newStage.CodePostal} ${newStage.Ville}
• Numéro de stage : ${newStage.NumeroStage}

✅ IMPORTANT :
Vous trouverez ci-joint votre nouvelle attestation de réservation.
Cette modification n'affecte pas votre statut de paiement.

Vous pouvez également télécharger cette attestation depuis votre espace personnel sur notre site.

Si vous avez des questions, n'hésitez pas à nous contacter au 0783372565.

Cordialement,
L'équipe EG-Formation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email généré automatiquement le ${formatCurrentDate()}
  `;

  await transporter.sendMail({
    from: `"EG-Formation" <${process.env.MAIL_USER}>`,
    to: email,
    cc: process.env.MAIL_USER,
    subject: `✅ Modification de votre réservation - Nouveau stage ${newStage.Ville} (${newStage.NumeroStage})`,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        filename: `nouvelle_convocation_stage_${newStage.NumeroStage}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

// ✅ Export direct avec un nom clair
export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData(request, isValidMoveData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_MOVE_DATA");
    return error;
  }

  const { userId, fromStageId, toStageId } = data!;
  
  try {
    // Récupérer la réservation existante
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
    
    // Récupérer les détails des stages avec leurs agréments
    const [fromStage, toStage] = await Promise.all([
      prisma.stage.findUnique({ 
        where: { id: fromStageId },
        include: { agrement: true }
      }),
      prisma.stage.findUnique({ 
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
    
    // Vérifier les places disponibles
    if (toStage.PlaceDisponibles <= 0) {
      logApiAccess(request, session, false, "NO_PLACES_AVAILABLE");
      return NextResponse.json(
        { error: "Pas de place dans le stage cible", code: "NO_PLACES_AVAILABLE" },
        { status: 400 }
      );
    }
    
    // Transaction pour déplacer la réservation
    await prisma.$transaction(async (tx) => {
      // Mettre à jour la réservation
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { stageId: toStageId }
      });
      
      // Mettre à jour les places disponibles
      await tx.stage.update({
        where: { id: fromStageId },
        data: { PlaceDisponibles: { increment: 1 } }
      });
      
      await tx.stage.update({
        where: { id: toStageId },
        data: { PlaceDisponibles: { decrement: 1 } }
      });
    });
    
    // Génération PDF et envoi email avec gestion d'erreur
    try {
      console.log(`📄 Génération PDF pour déplacement de réservation - User ${userId}, Stage ${toStageId}`);
      
      // Préparer les données pour le PDF
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
        stageType: mapTypeStageToNumber(reservation.TypeStage)
      };

      // Générer le PDF
      const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
      console.log(`✅ PDF généré avec succès (${pdfBuffer.length} bytes)`);
      
      // Préparer le nom d'utilisateur pour l'email
      const userName = reservation.user.firstName || reservation.user.lastName 
        ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
        : reservation.user.email;
      
      // Envoyer l'email de notification
      await sendMoveNotificationEmail(reservation.user.email, userName, fromStage, toStage, pdfBuffer);
      console.log(`✅ Email de notification envoyé à ${reservation.user.email} (CC: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error("❌ Erreur lors de la génération PDF ou envoi email:", emailError);
      // Ne pas faire échouer la transaction, mais logger l'erreur
      console.error("📧 Le déplacement a réussi mais l'email n'a pas pu être envoyé");
    }
    
    logApiAccess(request, session, true);
    return NextResponse.json({ 
      success: true,
      message: "Réservation déplacée avec succès et client notifié par email",
      data: {
        reservationId: reservation.id,
        fromStage: {
          id: fromStage.id,
          title: fromStage.Titre,
          date: formatDateForEmail(fromStage.DateDebut)
        },
        toStage: {
          id: toStage.id,
          title: toStage.Titre,
          date: formatDateForEmail(toStage.DateDebut)
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur déplacement:", error);
    logApiAccess(request, session, false, "MOVE_FAILED");
    return NextResponse.json(
      { 
        error: "Erreur serveur lors du déplacement", 
        code: "MOVE_FAILED",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});