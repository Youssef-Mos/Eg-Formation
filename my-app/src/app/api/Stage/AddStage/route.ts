// app/api/Stage/AddStage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

type StageData = {
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: string;
  DateFin: string;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  NumeroStage?: string;
  agrementId?: number; // Nouvel ajout pour l'agrément
};

// Validation améliorée pour inclure l'agrément
const isValidStageData = (data: any): data is StageData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.Titre === 'string' && data.Titre.trim().length > 0 &&
    typeof data.Adresse === 'string' && data.Adresse.trim().length > 0 &&
    typeof data.CodePostal === 'string' && data.CodePostal.trim().length > 0 &&
    typeof data.Ville === 'string' && data.Ville.trim().length > 0 &&
    typeof data.PlaceDisponibles === 'number' && data.PlaceDisponibles > 0 &&
    typeof data.DateDebut === 'string' &&
    typeof data.DateFin === 'string' &&
    typeof data.HeureDebut === 'string' &&
    typeof data.HeureFin === 'string' &&
    typeof data.HeureDebut2 === 'string' &&
    typeof data.HeureFin2 === 'string' &&
    typeof data.Prix === 'number' && data.Prix >= 0 &&
    (data.NumeroStage === undefined || typeof data.NumeroStage === 'string') &&
    (data.agrementId === undefined || (typeof data.agrementId === 'number' && data.agrementId > 0))
  );
};

export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData<StageData>(request, isValidStageData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_STAGE_DATA");
    return error;
  }

  try {
    // Vérifier si le numéro de stage existe déjà (si fourni)
    if (data!.NumeroStage) {
      const existingStage = await prisma.stage.findFirst({
        where: { NumeroStage: String(data!.NumeroStage) }
      });
      
      if (existingStage) {
        logApiAccess(request, session, false, "STAGE_NUMBER_EXISTS");
        return NextResponse.json(
          {
            error: "Numéro de stage déjà utilisé",
            code: "STAGE_NUMBER_EXISTS",
            message: `Le numéro de stage ${data!.NumeroStage} est déjà utilisé.`
          },
          { status: 409 }
        );
      }
    }

    // Vérifier que l'agrément existe (si fourni)
    if (data!.agrementId) {
      const existingAgrement = await prisma.agrement.findUnique({
        where: { id: data!.agrementId }
      });
      
      if (!existingAgrement) {
        logApiAccess(request, session, false, "AGREMENT_NOT_FOUND");
        return NextResponse.json(
          {
            error: "Agrément non trouvé",
            code: "AGREMENT_NOT_FOUND",
            message: "L'agrément sélectionné n'existe pas."
          },
          { status: 404 }
        );
      }
    }

    // Validation des dates
    const dateDebut = new Date(data!.DateDebut);
    const dateFin = new Date(data!.DateFin);
    
    if (dateDebut >= dateFin) {
      logApiAccess(request, session, false, "INVALID_DATES");
      return NextResponse.json(
        {
          error: "Dates invalides",
          code: "INVALID_DATES",
          message: "La date de fin doit être postérieure à la date de début."
        },
        { status: 400 }
      );
    }

    // Validation des horaires
    const validateTimeFormat = (time: string): boolean => {
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    };

    if (!validateTimeFormat(data!.HeureDebut) || !validateTimeFormat(data!.HeureFin) ||
        !validateTimeFormat(data!.HeureDebut2) || !validateTimeFormat(data!.HeureFin2)) {
      logApiAccess(request, session, false, "INVALID_TIME_FORMAT");
      return NextResponse.json(
        {
          error: "Format d'heure invalide",
          code: "INVALID_TIME_FORMAT",
          message: "Les heures doivent être au format HH:MM (ex: 09:00)."
        },
        { status: 400 }
      );
    }

    // Créer le stage avec l'agrément
    const stage = await prisma.stage.create({
      data: {
        Titre: data!.Titre.trim(),
        Adresse: data!.Adresse.trim(),
        CodePostal: data!.CodePostal.trim(),
        Ville: data!.Ville.trim(),
        PlaceDisponibles: data!.PlaceDisponibles,
        DateDebut: dateDebut,
        DateFin: dateFin,
        HeureDebut: data!.HeureDebut,
        HeureFin: data!.HeureFin,
        HeureDebut2: data!.HeureDebut2,
        HeureFin2: data!.HeureFin2,
        Prix: data!.Prix,
        NumeroStage: data!.NumeroStage?.trim() || "",
        agrementId: data!.agrementId || null,
      },
      include: {
        agrement: true // Inclure les données de l'agrément dans la réponse
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json(
      { message: "Stage créé avec succès", stage },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur API:", error);
    logApiAccess(request, session, false, "CREATE_FAILED");
    
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        {
          error: "Conflit de données",
          code: "DUPLICATE_DATA",
          message: "Ces données existent déjà dans la base de données."
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "CREATE_FAILED",
        message: "Erreur lors de l'ajout du stage."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});