// app/api/reservation/create-without-payment/route.ts - SANS DÉCOMPTE DE PLACE

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
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

    // ✅ MODIFICATION : Vérifier qu'il y a au moins 1 place, mais ne pas la décompter
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

    // ✅ MODIFICATION PRINCIPALE : Créer seulement la réservation, SANS décompter la place
    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(userId),
        stageId: Number(stageId),
        TypeStage: typeStage,
        paymentMethod: paymentMethod,
        paid: false // ❌ Non payé = pas de place décomptée
      }
    });

    console.log(`📝 Réservation créée sans paiement - ID: ${reservation.id}, User: ${user.email}, Stage: ${stage.NumeroStage}`);
    console.log(`📊 Places restantes inchangées: ${stage.PlaceDisponibles} (décompte à la validation paiement)`);

    // ✅ ENVOI D'EMAIL avec mise à jour du message
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

      // ✅ CONTENU EMAIL MODIFIÉ pour indiquer que la place n'est pas encore réservée
      const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

Votre demande de réservation pour le stage de sécurité routière a été enregistrée !

📋 DÉTAILS DE VOTRE DEMANDE :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Lieu : ${stage.Titre}
📍 Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}
📅 Dates : du ${formatDateForEmail(stage.DateDebut)} au ${formatDateForEmail(stage.DateFin)}
⏰ Horaires : ${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}
🔢 Numéro de stage : ${stage.NumeroStage}
${agrementInfo ? `${agrementInfo}\n` : ''}💰 Prix : ${stage.Prix}€
📋 Type : ${stageDescription}
💳 Méthode de paiement choisie : ${methodeFR}

🚨 PAIEMENT URGENT POUR SÉCURISER VOTRE PLACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT : Votre demande est enregistrée mais votre place ne sera définitivement réservée qu'après réception du paiement.

💡 SYSTÈME DE RÉSERVATION :
• Votre demande est en attente de paiement
• Les places sont attribuées aux premiers qui paient
• Plus vous payez rapidement, plus vous êtes sûr d'avoir votre place

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
2️⃣ Nous validons votre paiement et sécurisons votre place (sous 48h)
3️⃣ Vous recevez votre convocation officielle par email
4️⃣ Présentez-vous le jour J avec votre convocation et vos documents

⏰ DÉLAI CRITIQUE :
Merci d'effectuer le paiement dans les 72h pour garantir votre place.
Passé ce délai, votre demande pourra être annulée si le stage est complet.

📞 CONTACT :
En cas de question, contactez-nous au 0783372565.

Cordialement,
L'équipe EG-FORMATIONS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
N° de demande : ${reservation.id}
Date de demande : ${formatCurrentDate()}
      `;

      // ✅ Version HTML avec message adapté
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; border-bottom: 3px solid #f39c12; padding-bottom: 15px;">
              ⏳ Demande de réservation
            </h1>
            
            <p style="font-size: 16px; color: #34495e;">Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p style="color: #f39c12; font-weight: bold; background-color: #fef9e7; padding: 10px; border-radius: 5px;">
              📝 Votre demande de réservation a été enregistrée !
            </p>

            <h2 style="color: #2c3e50; border-left: 4px solid #f39c12; padding-left: 15px;">📋 Détails de votre demande</h2>
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
              <h3 style="color: #856404; margin-top: 0;">🚨 PAIEMENT URGENT POUR SÉCURISER</h3>
              <p style="color: #856404; margin-bottom: 10px;"><strong>⚠️ IMPORTANT :</strong> Votre demande est enregistrée mais votre place ne sera définitivement réservée qu'après réception du paiement.</p>
              <p style="color: #856404; margin-bottom: 0; font-size: 14px;">💡 Les places sont attribuées aux premiers qui paient !</p>
            </div>

            <div style="background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #2c3e50;">📋 Prochaines étapes :</h4>
              <ol style="color: #34495e; line-height: 1.6;">
                <li>Effectuez le paiement selon la méthode choisie</li>
                <li>Nous validons votre paiement et sécurisons votre place (sous 48h)</li>
                <li>Vous recevez votre convocation officielle par email</li>
                <li>Présentez-vous le jour J avec votre convocation et vos documents</li>
              </ol>
            </div>

            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0; font-weight: bold;">⏰ DÉLAI CRITIQUE : 72h pour garantir votre place</p>
            </div>

            <p style="text-align: center; margin-top: 30px;">
              <strong>📞 Questions ? Contactez-nous au 0783372565</strong>
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">Cordialement,</p>
              <p style="color: #2c3e50; font-weight: bold; margin: 5px 0;">L'équipe EG-FORMATIONS</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
              N° de demande : ${reservation.id} | Date de demande : ${formatCurrentDate()}
            </div>
          </div>
        </div>
      `;

      // Envoyer l'email avec sujet modifié
      await transporter.sendMail({
        from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
        to: user.email,
        cc: process.env.MAIL_USER,
        subject: `⏳ Demande enregistrée - Paiement urgent - Stage ${stage.Ville} (${stage.NumeroStage})`,
        text: emailContent,
        html: htmlContent,
      });

      console.log(`✅ Email de demande de paiement envoyé à: ${user.email} (copie à: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
      console.error('📧 La demande a réussi mais l\'email n\'a pas pu être envoyé');
    }

    // ✅ Réponse avec message adapté
    return NextResponse.json({
      success: true,
      message: "Demande de réservation enregistrée. Effectuez le paiement rapidement pour sécuriser votre place !",
      reservation: {
        id: reservation.id,
        userId: reservation.userId,
        stageId: reservation.stageId,
        TypeStage: reservation.TypeStage,
        paymentMethod: reservation.paymentMethod,
        paid: false,
        createdAt: reservation.createdAt
      },
      stage: {
        title: stage.Titre,
        city: stage.Ville,
        numero: stage.NumeroStage,
        dateDebut: formatDateForEmail(stage.DateDebut),
        price: stage.Prix,
        placesDisponibles: stage.PlaceDisponibles // ✅ Places inchangées
      },
      warning: "Votre place ne sera sécurisée qu'après validation du paiement."
    });

  } catch (error) {
    console.error("❌ Erreur lors de la création de la demande:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la création de la demande",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}