// app/api/reservation/validate-payment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
// 🆕 CHANGEMENT PRINCIPAL : Utiliser le nouveau générateur jsPDF
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";

const prisma = new PrismaClient();

// 🆕 Fonction helper pour mapper le type de stage vers le numéro
function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,        // Stage volontaire
    "permis_probatoire": 2,          // Permis probatoire  
    "alternative_poursuites": 3,     // Alternative aux poursuites (tribunal)
    "peine_complementaire": 4        // Peine complémentaire
  };
  
  return typeMapping[typeStage] || 1; // Par défaut : stage volontaire
}

// 🆕 Fonction pour envoyer l'email avec l'attestation (mise à jour)
async function sendPaymentConfirmationEmail(
  email: string, 
  userName: string, 
  stage: any, 
  user: any, 
  typeStage: string = "recuperation_points"
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  // 🆕 Préparer les données pour le nouveau générateur PDF
  const stageData = {
    id: stage.id,
    Titre: stage.Titre,
    Adresse: stage.Adresse,
    CodePostal: stage.CodePostal,
    Ville: stage.Ville,
    DateDebut: stage.DateDebut,
    DateFin: stage.DateFin,
    HeureDebut: stage.HeureDebut,
    HeureFin: stage.HeureFin,
    HeureDebut2: stage.HeureDebut2,
    HeureFin2: stage.HeureFin2,
    Prix: stage.Prix,
    NumeroStage: stage.NumeroStage,
    agrement: stage.agrement || null
  };

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  };

  const reservationOptions = {
    stageType: mapTypeStageToNumber(typeStage)
  };

  // 🆕 Générer le PDF avec le nouveau système
  const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);

  // 🆕 Déterminer le type de stage pour l'email
  const stageTypeDescriptions = {
    1: "Stage volontaire - Récupération de 4 points",
    2: "Stage obligatoire (période probatoire)",
    3: "Stage en alternative à la poursuite judiciaire",
    4: "Peine complémentaire ou sursis avec mise à l'épreuve"
  };

  const agrementInfo = stage.agrement 
    ? `\n🏛️ Agrément : ${stage.agrement.numeroAgrement} (${stage.agrement.departement}${stage.agrement.nomDepartement ? ` - ${stage.agrement.nomDepartement}` : ''})`
    : '';

  const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

🎉 PAIEMENT CONFIRMÉ ! 🎉

Nous avons le plaisir de vous informer que votre paiement pour le stage de sécurité routière a été validé avec succès.

📋 DÉTAILS DE VOTRE STAGE :
📍 Lieu : ${stage.Titre}
📍 Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}
📅 Dates : du ${new Date(stage.DateDebut).toLocaleDateString('fr-FR')} au ${new Date(stage.DateFin).toLocaleDateString('fr-FR')}
⏰ Horaires : ${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}
🔢 Numéro de stage : ${stage.NumeroStage}${agrementInfo}
💰 Prix : ${stage.Prix}€
📋 Type : ${stageTypeDescriptions[reservationOptions.stageType]}

✅ Votre place est désormais CONFIRMÉE et RÉSERVÉE.

📄 Votre convocation officielle est jointe à cet e-mail en format PDF.

IMPORTANT - À APPORTER LE JOUR DU STAGE :
- Votre permis de conduire et votre pièce d'identité
- Cette convocation (en version papier ou sur votre smartphone)
${reservationOptions.stageType === 2 ? '- La lettre 48N de la Préfecture' : ''}
${reservationOptions.stageType === 3 ? '- Le document transmis par le tribunal' : ''}
${reservationOptions.stageType === 4 ? '- Le document de justice (sursis avec mise à l\'épreuve)' : ''}

⚠️ RAPPEL IMPORTANT :
- Votre présence et le respect des horaires sont obligatoires
- L'absence même partielle ne permet pas la récupération de points

Pour toute question, contactez-nous au 0783372565.

Cordialement,
L'équipe EG-FORMATIONS
  `;

  await transporter.sendMail({
    from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `✅ Paiement confirmé - Convocation stage ${stage.Ville}`,
    text: emailContent,
    html: emailContent.replace(/\n/g, '<br>'),
    attachments: [
      {
        filename: `convocation_stage_${stage.NumeroStage}_${user.lastName.toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("✅ Email de confirmation de paiement envoyé à:", email);
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

    // 🆕 Récupérer les détails complets avec l'agrément inclus
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: {
        stage: {
          include: {
            agrement: true // ✅ CRUCIAL : Inclure l'agrément
          }
        },
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

    // 🆕 Préparer et envoyer l'email avec la nouvelle fonction
    try {
      console.log("📧 Génération et envoi de l'email de confirmation de paiement...");
      
      await sendPaymentConfirmationEmail(
        reservation.user.email,
        `${reservation.user.firstName || ''} ${reservation.user.lastName || ''}`.trim() || reservation.user.email,
        reservation.stage,
        reservation.user,
        reservation.TypeStage || "recuperation_points"
      );
      
      console.log("✅ Email de confirmation envoyé avec succès à", reservation.user.email);
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas bloquer la validation du paiement en cas d'erreur d'email
    }

    return NextResponse.json({
      success: true,
      message: "Paiement validé avec succès et email envoyé au client",
      reservation: updatedReservation
    });
  } catch (error) {
    console.error("❌ Erreur lors de la validation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la validation du paiement" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}