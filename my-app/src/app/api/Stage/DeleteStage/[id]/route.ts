import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stageId = Number(params.id);
    console.log("Suppression du stage d'ID:", stageId);

    const stage = await prisma.stage.delete({
      where: { id: stageId },
    });

    return NextResponse.json(stage, { status: 200 });
  } catch (error) {
    console.error("Erreur API lors de la suppression du stage:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du stage." },
      { status: 500 }
    );
  }
}
