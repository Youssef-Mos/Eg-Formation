// app/api/reservation/deplacer-resa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";
// IMPORT DU GÉNÉRATEUR jsPDF
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";

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

// Fonction helper pour mapper le type de stage vers le numéro
function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,        // Stage volontaire
    "permis_probatoire": 2,          // Permis probatoire  
    "alternative_poursuites": 3,     // Alternative aux poursuites (tribunal)
    "peine_complementaire": 4        // Peine complémentaire
  };
  
  return typeMapping[typeStage] || 1; // Par défaut : stage volontaire
}
*/
// Fonction pour envoyer l'email avec l'attestation
async function sendEmailNotification(email: string, userName: string, oldStage: any, newStage: any, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransporter({
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
    
    // 2. Récupérer les détails des deux stages AVEC L'AGRÉMENT
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
    
    // 5. Générer et envoyer l'attestation avec jsPDF
    try {
      console.log(`📄 Génération PDF pour déplacement de réservation - User ${userId}, Stage ${toStageId}`);
      
      // Transformer les données pour correspondre aux interfaces du générateur jsPDF
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

      // Générer le PDF avec jsPDF
      const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
      
      console.log(`✅ PDF généré avec succès (${pdfBuffer.length} bytes)`);
      
      // Envoyer l'email de notification
      const userName = reservation.user.firstName || reservation.user.lastName 
        ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
        : reservation.user.email;
      
      await sendEmailNotification(reservation.user.email, userName, fromStage, toStage, pdfBuffer);
      console.log(`✅ Email de notification envoyé à ${reservation.user.email}`);
      
    } catch (emailError) {
      console.error("❌ Erreur lors de la génération PDF ou envoi email:", emailError);
      // On continue malgré l'erreur email pour ne pas annuler le déplacement
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
    await prisma.$disconnect();
  }
});