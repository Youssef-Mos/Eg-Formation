import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Données reçues:", data);

    // Validation des données obligatoires
    const requiredFields = [
      'Titre', 'Adresse', 'CodePostal', 'Ville', 
      'PlaceDisponibles', 'NumeroStage', 'DateDebut', 
      'DateFin', 'HeureDebut', 'HeureFin', 'HeureDebut2', 
      'HeureFin2', 'Prix'
    ];

    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: "Champs manquants", 
          missingFields,
          message: `Les champs suivants sont obligatoires: ${missingFields.join(', ')}`
        }, 
        { status: 400 }
      );
    }

    // Vérifier si le numéro de stage existe déjà
    const existingStage = await prisma.stage.findFirst({
      where: { NumeroStage: String(data.NumeroStage) }
    });

    if (existingStage) {
      return NextResponse.json(
        { 
          error: "Numéro de stage déjà utilisé", 
          message: `Le numéro de stage ${data.NumeroStage} est déjà utilisé. Veuillez choisir un autre numéro.`
        }, 
        { status: 409 }
      );
    }

    // Validation des dates
    const dateDebut = new Date(data.DateDebut);
    const dateFin = new Date(data.DateFin);
    
    if (dateDebut >= dateFin) {
      return NextResponse.json(
        { 
          error: "Dates invalides", 
          message: "La date de fin doit être postérieure à la date de début."
        }, 
        { status: 400 }
      );
    }

    // Créer le stage
    const stage = await prisma.stage.create({
      data: {
        Titre: data.Titre.trim(),
        Adresse: data.Adresse.trim(),
        CodePostal: data.CodePostal.trim(),
        Ville: data.Ville.trim(),
        PlaceDisponibles: Number(data.PlaceDisponibles),
        NumeroStage: String(data.NumeroStage), // Nouveau champ ajouté
        DateDebut: dateDebut,
        DateFin: dateFin,
        HeureDebut: data.HeureDebut,
        HeureFin: data.HeureFin,
        HeureDebut2: data.HeureDebut2,
        HeureFin2: data.HeureFin2,
        Prix: Number(data.Prix),
      },
    });

    console.log("Stage créé avec succès:", stage);
    return NextResponse.json(
      { 
        message: "Stage créé avec succès", 
        stage 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur API:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { 
          error: "Conflit de données", 
          message: "Ce numéro de stage existe déjà dans la base de données."
        }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur serveur", 
        message: "Erreur lors de l'ajout du stage. Veuillez réessayer."
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}