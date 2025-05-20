// app/api/Stage/RecupStageById/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: "L'identifiant du stage est requis" },
      { status: 400 }
    );
  }

  try {
    const stage = await prisma.stage.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(stage);
  } catch (error: any) {
    console.error("Erreur lors de la récupération du stage:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération du stage" },
      { status: 500 }
    );
  }
}