// app/api/admin/invoice/generate/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";
import { generateInvoicePDF } from "@/app/utils/invoiceGeneratorJsPDF";

const prisma = new PrismaClient();

interface InvoiceCustomData {
  invoiceNumber: string;
  amount: number;
  // ✅ SUPPRIMÉ : Plus besoin de ces champs car on utilise les données utilisateur
  // customerAddress: string;
  // customerPostalCode: string;
  // customerCity: string;
}

export const POST = withAdminAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const { reservationId, customData }: { 
      reservationId: number; 
      customData: InvoiceCustomData 
    } = body;

    if (!reservationId || !customData) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // ✅ MODIFIÉ : Récupération complète des données utilisateur avec facturation
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
        Invoice: true
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    if (!reservation.paid) {
      return NextResponse.json(
        { error: "La réservation n'est pas payée" },
        { status: 400 }
      );
    }

    // Vérifier si une facture existe déjà
    const existingInvoice = await prisma.invoice.findFirst({
      where: { reservationId: reservationId }
    });

    // ✅ NOUVELLE LOGIQUE : Déterminer l'adresse de facturation à utiliser
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

    // ✅ NOUVEAU : Construire l'adresse complète pour la facture
    const fullAddress = [
      billingAddress.address1,
      billingAddress.address2,
      billingAddress.address3
    ].filter(Boolean).join(', ');

    // ✅ MODIFIÉ : Utilisation de l'adresse de facturation déterminée automatiquement
    const invoiceData = {
      invoiceNumber: customData.invoiceNumber,
      date: new Date(),
      dueDate: new Date(),
      customer: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        address: fullAddress, // ✅ Adresse automatiquement déterminée
        postalCode: billingAddress.postalCode || "",
        city: billingAddress.city || "",
        country: billingAddress.country || "FR"
      },
      stage: {
        title: reservation.stage.Titre,
        date: reservation.stage.DateDebut || new Date(),
        price: customData.amount,
        numeroStage: reservation.stage.NumeroStage || ""
      },
      payment: {
        stripePaymentId: "",
        amount: customData.amount,
        currency: "EUR",
        paymentDate: new Date(),
        method: reservation.paymentMethod || "card"
      }
    };

    // Générer le PDF avec votre générateur existant
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Préparer les données pour la base de données
    const invoiceDbData = {
      invoiceNumber: customData.invoiceNumber,
      amount: customData.amount,
      currency: "EUR",
      status: "paid",
      customerEmail: user.email,
      customerName: `${user.firstName || ""} ${user.lastName || ""}`,
      pdfData: pdfBuffer,
      dueDate: new Date(),
      userId: user.id,
      reservationId: reservation.id
    };

    let invoice;
    if (existingInvoice) {
      // Modifier la facture existante
      invoice = await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: invoiceDbData
      });
      console.log("✅ Facture modifiée:", invoice.invoiceNumber);
    } else {
      // Créer une nouvelle facture
      invoice = await prisma.invoice.create({
        data: invoiceDbData
      });
      console.log("✅ Facture créée:", invoice.invoiceNumber);
    }

    logApiAccess(request, session, true);

    return NextResponse.json({
      success: true,
      message: existingInvoice ? "Facture modifiée avec succès" : "Facture créée avec succès",
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt.toISOString()
      },
      // ✅ NOUVEAU : Informations sur l'adresse utilisée
      billingInfo: {
        usedBillingAddress: useBillingAddress,
        address: fullAddress,
        postalCode: billingAddress.postalCode,
        city: billingAddress.city,
        country: billingAddress.country
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la génération de la facture:", error);
    logApiAccess(request, session, false, "GENERATE_FAILED");
    
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "GENERATE_FAILED",
        message: "Erreur lors de la génération de la facture."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});