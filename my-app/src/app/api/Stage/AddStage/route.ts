// app/api/Stage/AddStage/route.ts - VERSION ULTRA SIMPLE VERCEL
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
  DateDebut: string; // ✅ MAINTENANT STRING FORMAT YYYY-MM-DD
  DateFin: string;   // ✅ MAINTENANT STRING FORMAT YYYY-MM-DD
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  NumeroStage?: string;
  agrementId?: number;
};

// ✅ FONCTION ULTRA SIMPLE pour créer une date à midi UTC
function createDateAtNoonUTC(dateString: string): Date {
  // dateString format: "2024-01-15"
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Format de date invalide: ${dateString}`);
  }
  
  // Créer directement à midi UTC - AUCUN décalage possible
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

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
    typeof data.DateDebut === 'string' && data.DateDebut.length > 0 &&
    typeof data.DateFin === 'string' && data.DateFin.length > 0 &&
    typeof data.HeureDebut === 'string' &&
    typeof data.HeureFin === 'string' &&
    typeof data.HeureDebut2 === 'string' &&
    typeof data.HeureFin2 === 'string' &&
    typeof data.Prix === 'number' && data.Prix >= 0 &&
    (data.NumeroStage === undefined || typeof data.NumeroStage === 'string') &&
    (data.agrementId === undefined || (typeof data.agrementId === 'number' && data.agrementId > 0))
  );
};

// ✅ Validation date simplifiée
const validateDateString = (dateString: string): boolean => {
  try {
    const date = createDateAtNoonUTC(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData<StageData>(request, isValidStageData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_STAGE_DATA");
    return error;
  }

  try {
    // ✅ Validation des dates avec la nouvelle fonction simple
    if (!validateDateString(data!.DateDebut)) {
      logApiAccess(request, session, false, "INVALID_DATE_DEBUT");
      return NextResponse.json(
        {
          error: "Date de début invalide",
          code: "INVALID_DATE_DEBUT",
          message: "La date de début fournie n'est pas valide."
        },
        { status: 400 }
      );
    }

    if (!validateDateString(data!.DateFin)) {
      logApiAccess(request, session, false, "INVALID_DATE_FIN");
      return NextResponse.json(
        {
          error: "Date de fin invalide", 
          code: "INVALID_DATE_FIN",
          message: "La date de fin fournie n'est pas valide."
        },
        { status: 400 }
      );
    }

    // ✅ CORRECTION PRINCIPALE : Créer les dates à midi UTC - JAMAIS de décalage
    const dateDebut = createDateAtNoonUTC(data!.DateDebut);
    const dateFin = createDateAtNoonUTC(data!.DateFin);
    
    console.log(`🔍 DATES DEBUG:`);
    console.log(`   String reçu début: ${data!.DateDebut}`);
    console.log(`   String reçu fin: ${data!.DateFin}`);
    console.log(`   Date créée début: ${dateDebut.toISOString()}`);
    console.log(`   Date créée fin: ${dateFin.toISOString()}`);
    
    // Validation que date fin > date début
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

    // ✅ Validation que la date de début n'est pas trop dans le passé
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (dateDebut < oneDayAgo) {
      logApiAccess(request, session, false, "DATE_IN_PAST");
      return NextResponse.json(
        {
          error: "Date dans le passé",
          code: "DATE_IN_PAST", 
          message: "La date de début ne peut pas être antérieure à hier."
        },
        { status: 400 }
      );
    }

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

    // ✅ Validation des horaires
    const validateTimeFormat = (time: string): boolean => {
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    };

    const validateTimeRange = (start: string, end: string): boolean => {
      const [startHours, startMinutes] = start.split(':').map(Number);
      const [endHours, endMinutes] = end.split(':').map(Number);
      
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;
      
      return endTime > startTime;
    };

    // Validation format des horaires
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

    // Validation logique des horaires (heure fin > heure début)
    if (!validateTimeRange(data!.HeureDebut, data!.HeureFin) || 
        !validateTimeRange(data!.HeureDebut2, data!.HeureFin2)) {
      logApiAccess(request, session, false, "INVALID_TIME_RANGE");
      return NextResponse.json(
        {
          error: "Plage horaire invalide",
          code: "INVALID_TIME_RANGE",
          message: "L'heure de fin doit être postérieure à l'heure de début."
        },
        { status: 400 }
      );
    }

    // ✅ Créer le stage avec les dates à midi UTC (jamais de décalage)
    const stage = await prisma.stage.create({
      data: {
        Titre: data!.Titre.trim(),
        Adresse: data!.Adresse.trim(),
        CodePostal: data!.CodePostal.trim(),
        Ville: data!.Ville.trim(),
        PlaceDisponibles: data!.PlaceDisponibles,
        DateDebut: dateDebut,  // ✅ Date créée à midi UTC
        DateFin: dateFin,      // ✅ Date créée à midi UTC
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

    console.log(`✅ Stage créé avec succès: ${stage.Titre} (${stage.NumeroStage})`);
    console.log(`   Dates stockées: ${stage.DateDebut.toISOString()} à ${stage.DateFin.toISOString()}`);

    logApiAccess(request, session, true);
    return NextResponse.json(
      { 
        message: "Stage créé avec succès", 
        stage,
        debug: {
          dateDebutReceived: data!.DateDebut,
          dateFinReceived: data!.DateFin,
          dateDebutStored: stage.DateDebut.toISOString(),
          dateFinStored: stage.DateFin.toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Erreur API création stage:", error);
    logApiAccess(request, session, false, "CREATE_FAILED");
    
    // Gestion spécifique des erreurs Prisma
    if (typeof error === "object" && error !== null && "code" in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          {
            error: "Conflit de données",
            code: "DUPLICATE_DATA",
            message: "Ces données existent déjà dans la base de données.",
            details: prismaError.meta?.target || "Champ inconnu"
          },
          { status: 409 }
        );
      }
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          {
            error: "Référence invalide",
            code: "FOREIGN_KEY_ERROR",
            message: "L'agrément référencé n'existe pas."
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "CREATE_FAILED",
        message: "Erreur lors de l'ajout du stage.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});