// ===== FICHIER 2: app/api/reservation/validate-payment/route.ts =====

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendConfirmationEmail } from "@/app/utils/convocationGeneratorJsPDF";

const prisma2 = new PrismaClient();

function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,
    "permis_probatoire": 2,
    "alternative_poursuites": 3,
    "peine_complementaire": 4
  };
  
  return typeMapping[typeStage] || 1;
}

export async function POST2(request: Request) {
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

    const reservation = await prisma2.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: {
        stage: {
          include: {
            agrement: true
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

    if (reservation.userId !== Number(userId) || reservation.stageId !== Number(stageId)) {
      return NextResponse.json(
        { error: "Les informations de réservation ne correspondent pas" },
        { status: 400 }
      );
    }

    if (reservation.paid) {
      return NextResponse.json(
        { error: "Cette réservation est déjà marquée comme payée" },
        { status: 400 }
      );
    }

    const updatedReservation = await prisma2.reservation.update({
      where: { id: Number(reservationId) },
      data: { paid: true }
    });

    // ✅ Envoi convocation avec dates corrigées (sendConfirmationEmail gère déjà les dates)
    try {
      console.log(`📧 Validation paiement + envoi convocation à ${reservation.user.email}...`);
      
      const stageData = {
        id: reservation.stage.id,
        Titre: reservation.stage.Titre,
        Adresse: reservation.stage.Adresse,
        CodePostal: reservation.stage.CodePostal,
        Ville: reservation.stage.Ville,
        DateDebut: reservation.stage.DateDebut,
        DateFin: reservation.stage.DateFin,
        HeureDebut: reservation.stage.HeureDebut,
        HeureFin: reservation.stage.HeureFin,
        HeureDebut2: reservation.stage.HeureDebut2,
        HeureFin2: reservation.stage.HeureFin2,
        Prix: reservation.stage.Prix,
        NumeroStage: reservation.stage.NumeroStage,
        agrement: reservation.stage.agrement
          ? {
              ...reservation.stage.agrement,
              nomDepartement: reservation.stage.agrement.nomDepartement ?? undefined
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
        stageType: mapTypeStageToNumber(reservation.TypeStage || "recuperation_points")
      };

      await sendConfirmationEmail(userData, stageData, reservationOptions);
      
      console.log(`✅ Convocation envoyée après validation paiement à ${userData.email} (CC: ${process.env.MAIL_USER})`);
      
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      
      await prisma2.reservation.update({
        where: { id: Number(reservationId) },
        data: { paid: false }
      });
      
      return NextResponse.json(
        { 
          error: "Erreur lors de l'envoi de la convocation. Le paiement n'a pas été validé.",
          details: emailError instanceof Error ? emailError.message : "Erreur inconnue"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `✅ Paiement validé ! Convocation envoyée à ${reservation.user.email}`,
      reservation: {
        id: updatedReservation.id,
        userId: updatedReservation.userId,
        stageId: updatedReservation.stageId,
        paid: true,
        userEmail: reservation.user.email,
        stageNumber: reservation.stage.NumeroStage
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la validation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la validation du paiement" },
      { status: 500 }
    );
  } finally {
    await prisma2.$disconnect();
  }
}