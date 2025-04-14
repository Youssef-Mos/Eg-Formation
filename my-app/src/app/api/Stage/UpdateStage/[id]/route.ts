import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const stageId = Number(params.id);
    const data = await request.json();

    // On attend dans 'data' au moins : Titre, Adresse, Prix, etc.
    const updatedStage = await prisma.stage.update({
      where: { id: stageId },
      data: {
        Titre: data.Titre,
        Adresse: data.Adresse,
        Prix: data.Prix,
        // Ajoutez d'autres champs ici si nécessaire.
      },
    });

    return NextResponse.json(updatedStage, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du stage :", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du stage." }, { status: 500 });
  }
}
