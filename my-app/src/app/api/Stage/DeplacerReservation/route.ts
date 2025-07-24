// app/api/reservation/deplacer-resa/route.ts - VERSION SANS PDF POUR NON PAYÉ

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";
import { formatDateForEmail, formatCurrentDate } from "@/app/utils/dateUtils";

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

function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,
    "permis_probatoire": 2,
    "alternative_poursuites": 3,
    "peine_complementaire": 4
  };
  
  return typeMapping[typeStage] || 1;
}

// ✅ FONCTION EMAIL CORRIGÉE - Pièce jointe conditionnelle selon le statut de paiement
async function sendMoveNotificationEmail(
  email: string, 
  userName: string, 
  oldStage: any, 
  newStage: any, 
  pdfBuffer: Buffer | null, // ✅ PEUT ÊTRE NULL
  isPaid: boolean,
  paymentMethod: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  // ✅ Traduction des méthodes de paiement
  const paymentMethodFR = {
    'bank_transfer': 'Virement bancaire',
    'check': 'Chèque', 
    'cash': 'Espèces',
    'card': 'Carte bancaire'
  };
  const methodeFR = paymentMethodFR[paymentMethod as keyof typeof paymentMethodFR] || paymentMethod;

  // ✅ CONTENU ADAPTÉ selon le statut de paiement
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
        <li><strong>Prix :</strong> ${newStage.Prix}€</li>
      </ul>
      
      ${isPaid ? `
        <!-- ✅ CLIENT PAYÉ -->
        <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Paiement confirmé</strong></p>
          <p style="margin: 5px 0 0 0;">Vous trouverez ci-joint votre nouvelle convocation officielle.</p>
          <p style="margin: 5px 0 0 0;">Cette modification n'affecte pas votre statut de paiement.</p>
        </div>
      ` : `
        <!-- ⚠️ CLIENT NON PAYÉ -->
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Paiement requis</strong></p>
          <p style="margin: 5px 0 0 0;">ATTENTION : Votre place a été déplacée mais vous devez encore effectuer le paiement.</p>
          <p style="margin: 5px 0 0 0;"><strong>Méthode de paiement :</strong> ${methodeFR}</p>
          <p style="margin: 5px 0 0 0;"><strong>Montant :</strong> ${newStage.Prix}€</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>📋 CONVOCATION</strong></p>
          <p style="margin: 5px 0 0 0; color: #721c24;">Votre convocation officielle vous sera envoyée <strong>après réception du paiement</strong>.</p>
        </div>
      `}
      
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
• Prix : ${newStage.Prix}€

${isPaid ? `
✅ PAIEMENT CONFIRMÉ :
Vous trouverez ci-joint votre nouvelle convocation officielle.
Cette modification n'affecte pas votre statut de paiement.
` : `
⚠️ PAIEMENT REQUIS :
ATTENTION : Votre place a été déplacée mais vous devez encore effectuer le paiement.

🚨 IMPORTANT :
• Méthode de paiement : ${methodeFR}
• Montant : ${newStage.Prix}€  
• Délai : 7 jours pour conserver votre place

📋 CONVOCATION :
Votre convocation officielle vous sera envoyée après réception du paiement.
Sans paiement, votre réservation sera annulée.
`}

Si vous avez des questions, n'hésitez pas à nous contacter au 0783372565.

Cordialement,
L'équipe EG-Formation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email généré automatiquement le ${formatCurrentDate()}
  `;

  // ✅ Sujet adapté selon le statut de paiement
  const subject = isPaid 
    ? `✅ Modification de votre réservation - Nouveau stage ${newStage.Ville} (${newStage.NumeroStage})`
    : `⚠️ Stage déplacé + Paiement requis - ${newStage.Ville} (${newStage.NumeroStage})`;

  // ✅ PIÈCE JOINTE CONDITIONNELLE
  const emailOptions: any = {
    from: `"EG-Formation" <${process.env.MAIL_USER}>`,
    to: email,
    cc: process.env.MAIL_USER,
    subject,
    text: textContent,
    html: htmlContent,
  };

  // ✅ AJOUTER LA PIÈCE JOINTE SEULEMENT SI PAYÉ
  if (isPaid && pdfBuffer) {
    emailOptions.attachments = [
      {
        filename: `nouvelle_convocation_stage_${newStage.NumeroStage}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  }

  await transporter.sendMail(emailOptions);
}

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
    
    // ✅ GÉNÉRATION PDF ET ENVOI EMAIL AVEC LOGIQUE CONDITIONNELLE
    try {
      console.log(`📄 Traitement email pour déplacement - User ${userId}, Stage ${toStageId}`);
      console.log(`💰 Statut paiement: ${reservation.paid ? 'PAYÉ' : 'NON PAYÉ'} (${reservation.paymentMethod})`);
      
      let pdfBuffer: Buffer | null = null;
      
      // ✅ GÉNÉRER LE PDF SEULEMENT SI LE CLIENT A PAYÉ
      if (reservation.paid) {
        console.log(`📄 Génération PDF (client payé)...`);
        
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
        pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
        console.log(`✅ PDF généré avec succès (${pdfBuffer.length} bytes)`);
      } else {
        console.log(`⚠️ Pas de génération PDF (client non payé)`);
      }
      
      // Préparer le nom d'utilisateur pour l'email
      const userName = reservation.user.firstName || reservation.user.lastName 
        ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
        : reservation.user.email;
      
      // ✅ Envoyer l'email avec ou sans pièce jointe selon le statut
      await sendMoveNotificationEmail(
        reservation.user.email, 
        userName, 
        fromStage, 
        toStage, 
        pdfBuffer, // ✅ NULL si non payé
        reservation.paid,
        reservation.paymentMethod
      );
      
      const pdfStatus = reservation.paid ? "avec convocation" : "sans convocation";
      console.log(`✅ Email envoyé à ${reservation.user.email} (${pdfStatus})`);
      
    } catch (emailError) {
      console.error("❌ Erreur lors de la génération PDF ou envoi email:", emailError);
      console.error("📧 Le déplacement a réussi mais l'email n'a pas pu être envoyé");
    }
    
    logApiAccess(request, session, true);
    return NextResponse.json({ 
      success: true,
      message: `Réservation déplacée avec succès. Email envoyé ${reservation.paid ? 'avec convocation' : 'avec rappel de paiement'}.`,
      data: {
        reservationId: reservation.id,
        paid: reservation.paid,
        paymentMethod: reservation.paymentMethod,
        pdfGenerated: reservation.paid, // ✅ Indique si le PDF a été généré
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