import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Données reçues:", data);
    
    const stage = await prisma.stage.create({
      data: {
        Titre: data.Titre,
        Adresse: data.Adresse,
        CodePostal: data.CodePostal,
        Ville: data.Ville,
        PlaceDisponibles: Number(data.PlaceDisponibles),
        DateDebut: new Date(data.DateDebut),
        DateFin: new Date(data.DateFin),
        HeureDebut: data.HeureDebut,
        HeureFin: data.HeureFin,
        Prix: Number(data.Prix),
      },
    });
    
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout du stage." }, { status: 500 });
  }
}
