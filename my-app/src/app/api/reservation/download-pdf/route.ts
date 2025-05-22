// app/api/reservation/download-pdf/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateReservationPDF } from "@/app/api/webhook/utils";

const prisma = new PrismaClient();

// Fonction helper pour mapper le type de stage vers le numéro
function mapTypeStageToNumber(typeStage: string): 1 | 2 | 3 | 4 {
  const typeMapping: Record<string, 1 | 2 | 3 | 4> = {
    "recuperation_points": 1,        // Stage volontaire
    "permis_probatoire": 2,          // Permis probatoire  
    "alternative_poursuites": 3,     // Alternative aux poursuites (tribunal)
    "peine_complementaire": 4        // Peine complémentaire
  };
  
  return typeMapping[typeStage] || 1; // Par défaut : stage volontaire
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  const stageId = Number(searchParams.get('stageId'));
  const typeStage = searchParams.get('typeStage') || "recuperation_points";
  
  if (!userId || !stageId) {
    return NextResponse.json({ error: "Paramètres manquants (userId et stageId requis)" }, { status: 400 });
  }

  try {
    // Récupérer les informations du stage et de l'utilisateur
    const stage = await prisma.stage.findUnique({
      where: { id: stageId }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!stage || !user) {
      return NextResponse.json({ 
        error: "Stage ou utilisateur non trouvé",
        details: {
          stageFound: !!stage,
          userFound: !!user
        }
      }, { status: 404 });
    }

    console.log(`📄 Génération PDF pour stage ${stageId}, utilisateur ${userId}, type: ${typeStage}`);
    
    // Transformer les données pour correspondre aux interfaces utils
    const stageData = {
      id: stage.id,
      Titre: stage.Titre,
      Adresse: stage.Adresse,
      CodePostal: stage.CodePostal,
      Ville: stage.Ville,
      DateDebut: stage.DateDebut,
      DateFin: stage.DateFin,
      HeureDebut: stage.HeureDebut,
      HeureFin: stage.HeureFin,
      HeureDebut2: stage.HeureDebut2,
      HeureFin2: stage.HeureFin2,
      Prix: stage.Prix,
      NumeroStage: stage.NumeroStage
    };

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };

    const reservationOptions = {
      stageType: mapTypeStageToNumber(typeStage)
    };
    
    // Générer le PDF en utilisant la fonction utils
    const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
    
    console.log(`✅ PDF généré avec succès (${pdfBuffer.length} bytes)`);
    
    // Convertir le Buffer en Uint8Array pour compatibilité Web
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Nom de fichier descriptif
    const filename = `convocation_stage_${stage.NumeroStage}_${user.lastName.toLowerCase()}.pdf`;

    // Renvoyer le PDF avec les headers appropriés
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error("❌ Erreur lors de la génération du PDF:", error);
    
    // Log détaillé pour debugging
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json({ 
      error: "Erreur lors de la génération du PDF",
      message: error.message,
      type: error.constructor.name
    }, { status: 500 });
  } finally {
    // Nettoyer la connexion Prisma
    await prisma.$disconnect();
  }
}

// Fonction GET pour tester l'API (optionnel - pour développement)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, stageId, typeStage } = body;
    
    if (!userId || !stageId) {
      return NextResponse.json({ error: "userId et stageId sont requis" }, { status: 400 });
    }

    // Rediriger vers la méthode GET avec les paramètres
    const url = new URL(request.url);
    url.searchParams.set('userId', userId.toString());
    url.searchParams.set('stageId', stageId.toString());
    if (typeStage) url.searchParams.set('typeStage', typeStage);
    
    return NextResponse.redirect(url.toString());
    
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors du traitement de la requête POST" }, { status: 500 });
  }
}