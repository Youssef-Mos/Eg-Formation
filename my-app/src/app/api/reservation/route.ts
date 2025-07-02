// app/api/reservation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { withAuth, validateRequestData, validators, logApiAccess } from "@/lib/apiSecurity";
import { sendConfirmationEmail } from "@/app/utils/convocationGeneratorJsPDF"; // ✅ AJOUT

const prisma = new PrismaClient();

// Validateur pour les données de réservation
const isValidReservationData = (data: any): data is { stageId: number } => {
  return typeof data === "object" && validators.isValidId(data.stageId);
};

export const POST = withAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData(request, isValidReservationData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_RESERVATION_DATA");
    return error;
  }

  const { stageId } = data!;
  const userId = Number(session.user.id);

  try {
    // ✅ MODIFICATION : Récupérer le stage AVEC l'agrément
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        agrement: true // ✅ Pour le PDF
      }
    });

    if (!stage) {
      logApiAccess(request, session, false, "STAGE_NOT_FOUND");
      return NextResponse.json(
        { error: "Stage non trouvé", code: "STAGE_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (stage.PlaceDisponibles <= 0) {
      logApiAccess(request, session, false, "NO_PLACES_AVAILABLE");
      return NextResponse.json(
        { error: "Plus de places disponibles", code: "NO_PLACES_AVAILABLE" },
        { status: 409 }
      );
    }

    // Vérifier si l'utilisateur n'a pas déjà réservé ce stage
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        userId_stageId: {
          userId,
          stageId
        }
      }
    });

    if (existingReservation) {
      logApiAccess(request, session, false, "ALREADY_RESERVED");
      return NextResponse.json(
        { error: "Vous avez déjà réservé ce stage", code: "ALREADY_RESERVED" },
        { status: 409 }
      );
    }

    // ✅ AJOUT : Récupérer les données utilisateur pour l'email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      logApiAccess(request, session, false, "USER_NOT_FOUND");
      return NextResponse.json(
        { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Créer la réservation et décrémenter les places
    const [reservation] = await Promise.all([
      prisma.reservation.create({
        data: { userId, stageId },
      }),
      prisma.stage.update({
        where: { id: stageId },
        data: { PlaceDisponibles: { decrement: 1 } }
      })
    ]);

    // ✅ AJOUT : Envoi de l'email de convocation
    try {
      console.log(`📧 Envoi de la convocation à ${user.email}...`);
      
      // Transformer les données pour le générateur PDF
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
        agrement: stage.agrement
          ? {
              ...stage.agrement,
              nomDepartement: stage.agrement.nomDepartement ?? undefined
            }
          : null
      };

      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      };

      const reservationOptions = {
        stageType: 1 as 1 | 2 | 3 | 4 // Par défaut : stage volontaire
      };

      // Envoyer l'email avec PDF
      await sendConfirmationEmail(userData, stageData, reservationOptions);
      
      console.log(`✅ Convocation envoyée à ${user.email}`);
      
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de la convocation:', emailError);
      // ⚠️ On continue même si l'email échoue - la réservation est créée
    }

    logApiAccess(request, session, true);
    return NextResponse.json({ 
      success: true, 
      reservation,
      message: "Réservation créée avec succès. Une convocation vous a été envoyée par email."
    });
  } catch (error: any) {
    console.error("Erreur création réservation:", error);
    logApiAccess(request, session, false, "CREATE_FAILED");
    return NextResponse.json(
      { error: "Erreur lors de la création de la réservation", code: "CREATE_FAILED" },
      { status: 500 }
    );
  }
});