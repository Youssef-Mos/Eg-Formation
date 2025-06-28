// app/api/admin/invoice/send/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const POST = withAdminAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const { reservationId, customMessage }: { 
      reservationId: number; 
      customMessage?: string;
    } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de réservation requis" },
        { status: 400 }
      );
    }

    // ✅ MISE À JOUR : Récupérer avec toutes les données d'adresse de facturation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            // Adresse principale
            address1: true,
            address2: true,
            address3: true,
            postalCode: true,
            city: true,
            country: true,
            // ✅ NOUVEAU : Adresse de facturation
            useSameAddressForBilling: true,
            billingAddress1: true,
            billingAddress2: true,
            billingAddress3: true,
            billingPostalCode: true,
            billingCity: true,
            billingCountry: true,
          }
        },
        stage: true,
        Invoice: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    const invoice = reservation.Invoice[0];
    if (!invoice) {
      return NextResponse.json(
        { error: "Aucune facture trouvée pour cette réservation" },
        { status: 404 }
      );
    }

    if (!invoice.pdfData) {
      return NextResponse.json(
        { error: "PDF de la facture non disponible" },
        { status: 404 }
      );
    }

    // ✅ NOUVEAU : Déterminer l'adresse de facturation utilisée
    const user = reservation.user;
    const useBillingAddress = !user.useSameAddressForBilling && user.billingAddress1;
    
    const billingAddress = {
      address1: useBillingAddress ? user.billingAddress1 : user.address1,
      address2: useBillingAddress ? user.billingAddress2 : user.address2,
      address3: useBillingAddress ? user.billingAddress3 : user.address3,
      postalCode: useBillingAddress ? user.billingPostalCode : user.postalCode,
      city: useBillingAddress ? user.billingCity : user.city,
      country: useBillingAddress ? user.billingCountry : user.country,
    };

    // ✅ NOUVEAU : Construire l'adresse complète pour l'email
    const fullBillingAddress = [
      billingAddress.address1,
      billingAddress.address2,
      billingAddress.address3
    ].filter(Boolean).join(', ');

    const addressType = useBillingAddress 
      ? 'votre adresse de facturation spécifique' 
      : 'votre adresse de domicile';

    // ✅ MISE À JOUR : Message email enrichi avec informations d'adresse
    const defaultMessage = `
Bonjour ${user.firstName || ""} ${user.lastName || ""},

Nous vous remercions pour votre participation au stage "${reservation.stage.Titre}".

Vous trouverez ci-joint votre facture n°${invoice.invoiceNumber} d'un montant de ${invoice.amount}€.

Détails de votre réservation :
- Stage : ${reservation.stage.Titre}
- Date : ${reservation.stage.DateDebut?.toLocaleDateString('fr-FR') || 'Non spécifié'}
- Numéro de stage : ${reservation.stage.NumeroStage || 'Non spécifié'}
- Type de stage : ${getTypeStageLabel(reservation.TypeStage)}
- Date de réservation : ${reservation.createdAt.toLocaleDateString('fr-FR')}

Adresse de facturation utilisée :
${fullBillingAddress}
${billingAddress.postalCode} ${billingAddress.city}
${billingAddress.country && billingAddress.country !== 'FR' ? getCountryName(billingAddress.country) : ''}

Cette facture a été établie selon ${addressType}.

Pour toute question concernant cette facture, n'hésitez pas à nous contacter au 07 83 37 25 65.

Cordialement,
L'équipe EG-FORMATIONS
    `.trim();

    const emailMessage = customMessage && customMessage.trim() 
      ? customMessage.trim() 
      : defaultMessage;

    // Configuration du transporteur email (même configuration que votre générateur)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    });

    // Convertir le PDF en Buffer
    const pdfBuffer = Buffer.from(invoice.pdfData as Uint8Array);

    // ✅ MISE À JOUR : Sujet d'email avec plus d'informations
    const emailSubject = `Facture n°${invoice.invoiceNumber} - ${reservation.stage.Titre} - EG-FORMATIONS`;

    // Envoyer l'email avec la facture en pièce jointe
    await transporter.sendMail({
      from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: emailSubject,
      text: emailMessage,
      html: emailMessage.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: `facture_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Facture envoyée par email à:", user.email);
    console.log(`✅ Adresse de facturation utilisée: ${addressType}`);

    logApiAccess(request, session, true);

    return NextResponse.json({
      success: true,
      message: "Facture envoyée avec succès par email",
      sentTo: user.email,
      invoiceNumber: invoice.invoiceNumber,
      // ✅ NOUVEAU : Informations sur l'adresse utilisée
      billingInfo: {
        usedBillingAddress: useBillingAddress,
        address: fullBillingAddress,
        addressType: addressType
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la facture:", error);
    logApiAccess(request, session, false, "SEND_FAILED");
    
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "SEND_FAILED",
        message: "Erreur lors de l'envoi de la facture par email."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// Fonction helper pour formater le type de stage
function getTypeStageLabel(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire",
    "stage": "Stage standard"
  };
  
  return types[type] || type;
}

// ✅ NOUVELLE FONCTION : Helper pour les noms de pays
function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
    "FR": "France",
    "BE": "Belgique",
    "CH": "Suisse",
    "LU": "Luxembourg",
    "DE": "Allemagne",
    "ES": "Espagne",
    "IT": "Italie",
    "PT": "Portugal",
    "NL": "Pays-Bas",
    "GB": "Royaume-Uni",
    "US": "États-Unis",
    "CA": "Canada"
  };
  
  return countries[countryCode] || countryCode;
}