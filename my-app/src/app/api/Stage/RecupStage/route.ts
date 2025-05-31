// app/api/Stage/RecupStage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    const stages = await prisma.stage.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        agrement: true, // NOUVEAU : Inclure les données d'agrément
        reservations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            reservations: true
          }
        }
      }
    });

    // Calculer les places restantes pour chaque stage
    const stagesAvecPlacesRestantes = stages.map(stage => ({
      ...stage,
      PlacesRestantes: Math.max(0, stage.PlaceDisponibles - stage._count.reservations),
      // Inclure les informations d'agrément dans la réponse
      AgrementInfo: stage.agrement ? {
        departement: stage.agrement.departement,
        numeroAgrement: stage.agrement.numeroAgrement,
        nomDepartement: stage.agrement.nomDepartement
      } : null
    }));

    return NextResponse.json(stagesAvecPlacesRestantes, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la récupération des stages:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        code: "FETCH_FAILED",
        message: "Erreur lors de la récupération des stages."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};