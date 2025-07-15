// ===== FICHIER 1: app/api/reservation/create-without-payment/route.ts =====

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
// ✅ IMPORT DES UTILS DE DATE
import { formatDateForEmail, formatCurrentDate } from "@/app/utils/dateUtils";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour effectuer une réservation" },
      { status: 401 }
    );
  }

  try {
    // Récupérer les données de la requête
    const { stageId, userId, typeStage, paymentMethod } = await request.json();

    // Vérifications de base
    if (!stageId || !userId || !typeStage || !paymentMethod) {
      return NextResponse.json(
        { error: "Données de réservation incomplètes" },
        { status: 400 }
      );
    }

    // Vérifier que l'ID utilisateur est cohérent avec la session
    if (userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "ID utilisateur non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les détails du stage AVEC l'agrément
    const stage = await prisma.stage.findUnique({
      where: { id: Number(stageId) },
      include: {
        agrement: true
      }
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage non trouvé" },
        { status: 404 }
      );
    }

    if (stage.PlaceDisponibles <= 0) {
      return NextResponse.json(
        { error: "Plus de places disponibles pour ce stage" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà réservé ce stage
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId: Number(userId),
          stageId: Number(stageId)
        }
      }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "Vous avez déjà réservé ce stage" },
        { status: 400 }
      );
    }

    // Récupérer les informations utilisateur
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Créer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(userId),
        stageId: Number(stageId),
        TypeStage: typeStage,
        paymentMethod: paymentMethod,
        paid: false
      }
    });

    // Mettre à jour le nombre de places disponibles
    await prisma.stage.update({
      where: { id: Number(stageId) },
      data: {
        PlaceDisponibles: stage.PlaceDisponibles - 1
      }
    });

    // ✅ ENVOI D'EMAIL avec dates corrigées
    try {
      console.log(`📧 Envoi de la notification de paiement à ${user.email}...`);
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER!,
          pass: process.env.MAIL_PASS!,
        },
      });

      const stageTypeDescriptions = {
        "recuperation_points": "Stage volontaire - Récupération de 4 points",
        "permis_probatoire": "Stage obligatoire (période probatoire)",
        "alternative_poursuites": "Stage en alternative à la poursuite judiciaire",
        "peine_complementaire": "Peine complémentaire ou sursis avec mise à l'épreuve"
      };

      const stageDescription = stageTypeDescriptions[typeStage as keyof typeof stageTypeDescriptions] || typeStage;

      const agrementInfo = stage.agrement 
        ? `🏛️ Agrément : ${stage.agrement.numeroAgrement} (${stage.agrement.departement}${stage.agrement.nomDepartement ? ` - ${stage.agrement.nomDepartement}` : ''})`
        : '';

      const paymentMethodFR = {
        'bank_transfer': 'Virement bancaire',
        'check': 'Chèque',
        'cash': 'Espèces',
        'card': 'Carte bancaire'
      };

      const methodeFR = paymentMethodFR[paymentMethod as keyof typeof paymentMethodFR] || paymentMethod;

      const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

Votre réservation pour le stage de sécurité routière a été enregistrée avec succès !

📋 DÉTAILS DE VOTRE RÉSERVATION :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Lieu : ${stage.Titre}
📍 Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}
📅 Dates : du ${formatDateForEmail(stage.DateDebut)} au ${formatDateForEmail(stage.DateFin)}
⏰ Horaires : ${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}
🔢 Numéro de stage : ${stage.NumeroStage}
${agrementInfo ? `${agrementInfo}\n` : ''}💰 Prix : ${stage.Prix}€
📋 Type : ${stageDescription}
💳 Méthode de paiement choisie : ${methodeFR}

🚨 PAIEMENT REQUIS POUR FINALISER VOTRE INSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT : Votre place est réservée, mais vous devez effectuer le paiement pour recevoir votre convocation officielle.

${paymentMethod === 'bank_transfer' ? `
💸 VIREMENT BANCAIRE :
• Montant : ${stage.Prix}€
• Référence à indiquer : ${user.lastName.toUpperCase()}_${stage.NumeroStage}
• Coordonnées bancaires : [À compléter avec vos coordonnées]
` : ''}${paymentMethod === 'check' ? `
📧 CHÈQUE :
• Montant : ${stage.Prix}€
• À l'ordre de : EG-FORMATIONS
• Référence au dos : ${user.lastName.toUpperCase()}_${stage.NumeroStage}
• Adresse d'envoi : [À compléter avec votre adresse]
` : ''}${paymentMethod === 'cash' ? `
💵 PAIEMENT EN ESPÈCES :
• Montant : ${stage.Prix}€
• Rendez-vous à convenir
• Référence : ${user.lastName.toUpperCase()}_${stage.NumeroStage}
` : ''}${paymentMethod === 'card' ? `
💳 PAIEMENT PAR CARTE :
• Montant : ${stage.Prix}€
• Lien de paiement sécurisé à suivre
• Référence : ${user.lastName.toUpperCase()}_${stage.NumeroStage}
` : ''}

📋 PROCHAINES ÉTAPES :
━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Effectuez le paiement selon la méthode choisie
2️⃣ Nous validons votre paiement (sous 48h)
3️⃣ Vous recevez votre convocation officielle par email
4️⃣ Présentez-vous le jour J avec votre convocation et vos documents

⏰ DÉLAI DE PAIEMENT :
Merci d'effectuer le paiement dans les 7 jours suivant cette réservation pour conserver votre place.

📞 CONTACT :
En cas de question, contactez-nous au 0783372565.

Cordialement,
L'équipe EG-FORMATIONS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
N° de réservation : ${reservation.id}
Date de réservation : ${formatCurrentDate()}
      `;

      await transporter.sendMail({
        from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
        to: user.email,
        cc: process.env.MAIL_USER,
        subject: `🚨 Paiement requis - Stage ${stage.Ville} (${stage.NumeroStage})`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>').replace(/━/g, '─'),
      });

      console.log(`✅ Email de notification de paiement envoyé à: ${user.email} (copie à: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de paiement:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Réservation créée avec succès. Un email avec les instructions de paiement vous a été envoyé.",
      reservation: {
        id: reservation.id,
        userId: reservation.userId,
        stageId: reservation.stageId,
        TypeStage: reservation.TypeStage,
        paymentMethod: reservation.paymentMethod,
        paid: reservation.paid,
        createdAt: reservation.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la réservation" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
