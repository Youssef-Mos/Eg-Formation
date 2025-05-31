// app/api/Agrement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

type AgrementData = {
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
};

// Validation pour les données d'agrément
const isValidAgrementData = (data: any): data is AgrementData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.departement === 'string' && data.departement.trim().length > 0 &&
    typeof data.numeroAgrement === 'string' && data.numeroAgrement.trim().length > 0 &&
    (data.nomDepartement === undefined || typeof data.nomDepartement === 'string')
  );
};

// GET - Récupérer tous les agréments
export const GET = withAdminAuth(async (request: NextRequest, { session }) => {
  try {
    const agrements = await prisma.agrement.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            stages: true
          }
        }
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json(agrements, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la récupération des agréments:", error);
    logApiAccess(request, session, false, "FETCH_FAILED");
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "FETCH_FAILED",
        message: "Erreur lors de la récupération des agréments."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// POST - Créer un nouvel agrément
export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  const { data, error } = await validateRequestData<AgrementData>(request, isValidAgrementData);
  
  if (error) {
    logApiAccess(request, session, false, "INVALID_AGREMENT_DATA");
    return error;
  }

  try {
    // Vérifier si l'agrément existe déjà pour ce département
    const existingAgrement = await prisma.agrement.findFirst({
      where: { 
        OR: [
          { departement: data!.departement.trim() },
          { numeroAgrement: data!.numeroAgrement.trim() }
        ]
      }
    });

    if (existingAgrement) {
      logApiAccess(request, session, false, "AGREMENT_EXISTS");
      return NextResponse.json(
        {
          error: "Agrément déjà existant",
          code: "AGREMENT_EXISTS",
          message: existingAgrement.departement === data!.departement.trim() 
            ? `Un agrément existe déjà pour le département ${data!.departement}`
            : `Le numéro d'agrément ${data!.numeroAgrement} est déjà utilisé.`
        },
        { status: 409 }
      );
    }

    // Créer l'agrément
    const agrement = await prisma.agrement.create({
      data: {
        departement: data!.departement.trim(),
        numeroAgrement: data!.numeroAgrement.trim(),
        nomDepartement: data!.nomDepartement?.trim() || null,
      },
    });

    logApiAccess(request, session, true);
    return NextResponse.json(
      { message: "Agrément créé avec succès", agrement },
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
          message: "Cet agrément existe déjà dans la base de données."
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "CREATE_FAILED",
        message: "Erreur lors de l'ajout de l'agrément."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});