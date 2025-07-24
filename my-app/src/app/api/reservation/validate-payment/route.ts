// app/api/reservation/validate-payment/route.ts - AVEC DÉCOMPTE DE PLACE

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendConfirmationEmail } from "@/app/utils/convocationGeneratorJsPDF";

const prisma = new PrismaClient();

function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,
    "permis_probatoire": 2,
    "alternative_poursuites": 3,
    "peine_complementaire": 4
  };
  
  return typeMapping[typeStage] || 1;
}

export async function POST(request: Request) {
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

    const reservation = await prisma.reservation.findUnique({
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

    // ✅ MODIFICATION PRINCIPALE : Vérifier les places disponibles au moment du paiement
    if (reservation.stage.PlaceDisponibles <= 0) {
      return NextResponse.json(
        { 
          error: "Impossible de valider le paiement : plus de places disponibles dans ce stage",
          code: "NO_PLACES_AVAILABLE",
          message: "Le stage est complet. La demande de réservation doit être annulée."
        },
        { status: 409 }
      );
    }

    console.log(`💰 Validation paiement - Réservation ${reservationId}, Stage ${reservation.stage.NumeroStage}`);
    console.log(`📊 Places avant validation: ${reservation.stage.PlaceDisponibles}`);

    // ✅ TRANSACTION : Valider paiement + décompter place en une seule opération
    const updatedReservation = await prisma.$transaction(async (tx) => {
      // 1. Marquer comme payé
      const reservationPayee = await tx.reservation.update({
        where: { id: Number(reservationId) },
        data: { paid: true }
      });

      // 2. Décompter la place du stage
      await tx.stage.update({
        where: { id: Number(stageId) },
        data: {
          PlaceDisponibles: {
            decrement: 1
          }
        }
      });

      console.log(`✅ Transaction réussie - Paiement validé + Place décomptée`);
      return reservationPayee;
    });

    // ✅ Récupérer les infos mises à jour pour les logs
    const updatedStage = await prisma.stage.findUnique({
      where: { id: Number(stageId) },
      select: { PlaceDisponibles: true }
    });

    console.log(`📊 Places après validation: ${updatedStage?.PlaceDisponibles}`);

    // ✅ Envoi convocation après validation réussie
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
      
      // ✅ ROLLBACK COMPLET en cas d'erreur email
      try {
        await prisma.$transaction(async (tx) => {
          // Annuler le paiement
          await tx.reservation.update({
            where: { id: Number(reservationId) },
            data: { paid: false }
          });
          
          // Remettre la place
          await tx.stage.update({
            where: { id: Number(stageId) },
            data: {
              PlaceDisponibles: {
                increment: 1
              }
            }
          });
        });
        
        console.log(`🔄 Rollback effectué - Paiement annulé + Place restituée`);
      } catch (rollbackError) {
        console.error("❌ ERREUR CRITIQUE - Impossible de faire le rollback:", rollbackError);
      }
      
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
      message: `✅ Paiement validé et place sécurisée ! Convocation envoyée à ${reservation.user.email}`,
      reservation: {
        id: updatedReservation.id,
        userId: updatedReservation.userId,
        stageId: updatedReservation.stageId,
        paid: true,
        userEmail: reservation.user.email,
        stageNumber: reservation.stage.NumeroStage
      },
      stage: {
        placesRestantes: updatedStage?.PlaceDisponibles || 0
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la validation du paiement:", error);
    
    // ✅ Gestion spécifique des erreurs de transaction
    if (error instanceof Error && error.message.includes('PlaceDisponibles')) {
      return NextResponse.json(
        { 
          error: "Erreur de concurrence : plus de places disponibles",
          code: "CONCURRENT_BOOKING_ERROR"
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la validation du paiement",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}