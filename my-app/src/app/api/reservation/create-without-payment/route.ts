// app/api/reservation/create-without-payment/route.ts - VERSION CORRIGÉE POUR VERCEL

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
// ✅ CORRECTION : Utiliser UNIQUEMENT les fonctions du dateUtils centralisé
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

    // ✅ Transaction pour créer la réservation et mettre à jour les places
    const reservation = await prisma.$transaction(async (tx) => {
      // Créer la réservation
      const newReservation = await tx.reservation.create({
        data: {
          userId: Number(userId),
          stageId: Number(stageId),
          TypeStage: typeStage,
          paymentMethod: paymentMethod,
          paid: false
        }
      });

      // Mettre à jour le nombre de places disponibles
      await tx.stage.update({
        where: { id: Number(stageId) },
        data: {
          PlaceDisponibles: stage.PlaceDisponibles - 1
        }
      });

      return newReservation;
    });

    // ✅ ENVOI D'EMAIL avec dates corrigées et formatage amélioré
    try {
      console.log(`📧 Envoi de la notification de paiement à ${user.email}...`);
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER!,
          pass: process.env.MAIL_PASS!,
        },
      });

      // Descriptions des types de stage
      const stageTypeDescriptions = {
        "recuperation_points": "Stage volontaire - Récupération de 4 points",
        "permis_probatoire": "Stage obligatoire (période probatoire)",
        "alternative_poursuites": "Stage en alternative à la poursuite judiciaire",
        "peine_complementaire": "Peine complémentaire ou sursis avec mise à l'épreuve"
      };

      const stageDescription = stageTypeDescriptions[typeStage as keyof typeof stageTypeDescriptions] || typeStage;

      // Informations sur l'agrément si disponible
      const agrementInfo = stage.agrement 
        ? `🏛️ Agrément : ${stage.agrement.numeroAgrement} (${stage.agrement.departement}${stage.agrement.nomDepartement ? ` - ${stage.agrement.nomDepartement}` : ''})`
        : '';

      // Traduction des méthodes de paiement
      const paymentMethodFR = {
        'bank_transfer': 'Virement bancaire',
        'check': 'Chèque',
        'cash': 'Espèces',
        'card': 'Carte bancaire'
      };

      const methodeFR = paymentMethodFR[paymentMethod as keyof typeof paymentMethodFR] || paymentMethod;

      // ✅ Contenu de l'email avec dates formatées de façon sûre
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

      // ✅ Version HTML avec styles améliorés
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 15px;">
              ✅ Réservation enregistrée
            </h1>
            
            <p style="font-size: 16px; color: #34495e;">Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p style="color: #27ae60; font-weight: bold; background-color: #d5edda; padding: 10px; border-radius: 5px;">
              🎉 Votre réservation pour le stage de sécurité routière a été enregistrée avec succès !
            </p>

            <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px;">📋 Détails de votre réservation</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">📍 Lieu :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stage.Titre}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">📍 Adresse :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">📅 Dates :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">du ${formatDateForEmail(stage.DateDebut)} au ${formatDateForEmail(stage.DateFin)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">⏰ Horaires :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">🔢 N° de stage :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stage.NumeroStage}</td></tr>
              ${agrementInfo ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">🏛️ Agrément :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stage.agrement?.numeroAgrement} (${stage.agrement?.departement})</td></tr>` : ''}
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">💰 Prix :</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #e74c3c; font-weight: bold;">${stage.Prix}€</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">📋 Type :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stageDescription}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">💳 Paiement :</td><td style="padding: 8px;">${methodeFR}</td></tr>
            </table>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #856404; margin-top: 0;">🚨 PAIEMENT REQUIS POUR FINALISER</h3>
              <p style="color: #856404; margin-bottom: 0;"><strong>⚠️ IMPORTANT :</strong> Votre place est réservée, mais vous devez effectuer le paiement pour recevoir votre convocation officielle.</p>
            </div>

            <div style="background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #2c3e50;">📋 Prochaines étapes :</h4>
              <ol style="color: #34495e; line-height: 1.6;">
                <li>Effectuez le paiement selon la méthode choisie</li>
                <li>Nous validons votre paiement (sous 48h)</li>
                <li>Vous recevez votre convocation officielle par email</li>
                <li>Présentez-vous le jour J avec votre convocation et vos documents</li>
              </ol>
            </div>

            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0;"><strong>⏰ DÉLAI :</strong> Merci d'effectuer le paiement dans les 7 jours pour conserver votre place.</p>
            </div>

            <p style="text-align: center; margin-top: 30px;">
              <strong>📞 Questions ? Contactez-nous au 0783372565</strong>
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">Cordialement,</p>
              <p style="color: #2c3e50; font-weight: bold; margin: 5px 0;">L'équipe EG-FORMATIONS</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
              N° de réservation : ${reservation.id} | Date de réservation : ${formatCurrentDate()}
            </div>
          </div>
        </div>
      `;

      // Envoyer l'email
      await transporter.sendMail({
        from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
        to: user.email,
        cc: process.env.MAIL_USER, // ✅ CC automatique au gestionnaire
        subject: `🚨 Paiement requis - Stage ${stage.Ville} (${stage.NumeroStage})`,
        text: emailContent,
        html: htmlContent,
      });

      console.log(`✅ Email de notification de paiement envoyé à: ${user.email} (copie à: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de paiement:', emailError);
      // Ne pas faire échouer la réservation si l'email ne peut pas être envoyé
      console.error('📧 La réservation a réussi mais l\'email n\'a pas pu être envoyé');
    }

    // ✅ Réponse de succès avec toutes les informations
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
      },
      stage: {
        title: stage.Titre,
        city: stage.Ville,
        numero: stage.NumeroStage,
        dateDebut: formatDateForEmail(stage.DateDebut),
        price: stage.Prix
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la création de la réservation",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}