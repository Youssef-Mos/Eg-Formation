// app/api/admin/invoice/download/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export const GET = withAdminAuth(async (request, { session }) => {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const reservationId = searchParams.get("reservationId");

    if (!invoiceId && !reservationId) {
      return NextResponse.json(
        { error: "ID de facture ou de réservation requis" },
        { status: 400 }
      );
    }

    // ✅ MISE À JOUR : Récupérer la facture avec les données complètes
    let invoice;
    let reservation = null;

    if (invoiceId) {
      invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(invoiceId) },
        include: {
          reservation: {
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
                  Titre: true,
                  NumeroStage: true,
                  DateDebut: true
                }
              }
            }
          }
        }
      });
      reservation = invoice?.reservation;
    } else if (reservationId) {
      reservation = await prisma.reservation.findUnique({
        where: { id: parseInt(reservationId) },
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
              Titre: true,
              NumeroStage: true,
              DateDebut: true
            }
          },
          Invoice: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      invoice = reservation?.Invoice[0];
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    if (!invoice.pdfData) {
      return NextResponse.json(
        { error: "PDF de la facture non disponible" },
        { status: 404 }
      );
    }

    // ✅ NOUVEAU : Logging avec informations d'adresse de facturation
    if (reservation?.user) {
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

      const fullBillingAddress = [
        billingAddress.address1,
        billingAddress.address2,
        billingAddress.address3
      ].filter(Boolean).join(', ');

      const addressType = useBillingAddress 
        ? 'adresse de facturation spécifique' 
        : 'adresse de domicile';

      console.log(`✅ Téléchargement facture ${invoice.invoiceNumber} pour ${user.firstName} ${user.lastName}`);
      console.log(`✅ Adresse de facturation: ${addressType} - ${fullBillingAddress}, ${billingAddress.postalCode} ${billingAddress.city}`);
    }

    // Créer la réponse avec le PDF
    const pdfBuffer = Buffer.from(invoice.pdfData as Uint8Array);

    logApiAccess(request, session, true);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture_${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors du téléchargement de la facture:", error);
    logApiAccess(request, session, false, "DOWNLOAD_FAILED");
    
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "DOWNLOAD_FAILED",
        message: "Erreur lors du téléchargement de la facture."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});