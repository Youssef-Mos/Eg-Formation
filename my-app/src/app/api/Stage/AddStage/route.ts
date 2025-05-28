// app/api/stages/route.ts
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
  Prix: number;
  NumeroStage?: string; // Ajout de la propriété optionnelle
};

export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData<StageData>(request, validators.isValidStageData);
  
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

    // Créer le stage
    const stage = await prisma.stage.create({
      data: {
        Titre: data!.Titre.trim(),
        Adresse: data!.Adresse.trim(),
        CodePostal: data!.CodePostal,
        Ville: data!.Ville.trim(),
        PlaceDisponibles: data!.PlaceDisponibles,
        DateDebut: dateDebut,
        DateFin: dateFin,
        Prix: data!.Prix,
        HeureDebut: "09:00", // Remplacez par la valeur appropriée ou récupérez-la depuis data!
        HeureFin: "17:00",   // Remplacez par la valeur appropriée ou récupérez-la depuis data!
      },
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