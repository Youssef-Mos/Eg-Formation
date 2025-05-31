// app/api/admin/invoice/list/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export const GET = withAdminAuth(async (request, { session }) => {
  try {
    // ✅ MODIFIÉ : Récupération avec toutes les données d'adresse de facturation
    const reservations = await prisma.reservation.findMany({
      where: {
        paid: true // Seulement les réservations payées
      },
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
        stage: {
          select: {
            id: true,
            Titre: true,
            DateDebut: true,
            Prix: true,
            NumeroStage: true
          }
        },
        Invoice: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Récupérer la facture la plus récente
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // ✅ MODIFIÉ : Transformation avec calcul d'adresse de facturation
    const formattedReservations = reservations.map(reservation => {
      const latestInvoice = reservation.Invoice[0] || null;
      
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
      const fullBillingAddress = [
        billingAddress.address1,
        billingAddress.address2,
        billingAddress.address3
      ].filter(Boolean).join(', ');

      return {
        reservationId: reservation.id,
        customer: {
          id: reservation.user.id,
          firstName: reservation.user.firstName || "",
          lastName: reservation.user.lastName || "",
          email: reservation.user.email,
          // Adresse de domicile (pour affichage)
          address: reservation.user.address1 || "",
          postalCode: reservation.user.postalCode || "",
          city: reservation.user.city || "",
          // ✅ NOUVEAU : Adresse de facturation (utilisée pour les factures)
          billingAddress: fullBillingAddress,
          billingPostalCode: billingAddress.postalCode || "",
          billingCity: billingAddress.city || "",
          billingCountry: billingAddress.country || "",
          useSameAddressForBilling: user.useSameAddressForBilling,
        },
        stage: {
          id: reservation.stage.id,
          title: reservation.stage.Titre,
          date: reservation.stage.DateDebut?.toISOString() || "",
          price: reservation.stage.Prix,
          numeroStage: reservation.stage.NumeroStage || ""
        },
        reservation: {
          id: reservation.id,
          createdAt: reservation.createdAt.toISOString(),
          paymentMethod: reservation.paymentMethod,
          typeStage: reservation.TypeStage
        },
        invoice: latestInvoice ? {
          id: latestInvoice.id,
          invoiceNumber: latestInvoice.invoiceNumber,
          amount: latestInvoice.amount,
          status: latestInvoice.status,
          createdAt: latestInvoice.createdAt.toISOString()
        } : null,
        hasInvoice: !!latestInvoice,
        needsInvoice: !latestInvoice // Besoin d'une facture si aucune n'existe
      };
    });

    logApiAccess(request, session, true);

    return NextResponse.json({
      success: true,
      reservations: formattedReservations,
      total: formattedReservations.length
    });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des factures:", error);
    logApiAccess(request, session, false, "LIST_FAILED");
    
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "LIST_FAILED",
        message: "Erreur lors de la récupération des données."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});