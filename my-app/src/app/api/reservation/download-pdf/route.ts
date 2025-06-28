// app/api/reservation/download-pdf/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// CHANGEMENT PRINCIPAL : Utiliser le nouveau générateur jsPDF
import { generateReservationPDF } from "@/app/utils/convocationGeneratorJsPDF";

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
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour télécharger une attestation" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  const stageId = Number(searchParams.get('stageId'));
  const typeStage = searchParams.get('typeStage') || "recuperation_points";
  
  if (!userId || !stageId) {
    return NextResponse.json({ 
      error: "Paramètres manquants (userId et stageId requis)" 
    }, { status: 400 });
  }

  // Vérifier que l'utilisateur demande ses propres documents
  if (userId !== Number(session.user.id)) {
    return NextResponse.json(
      { error: "Vous ne pouvez télécharger que vos propres attestations" },
      { status: 403 }
    );
  }

  try {
    // CORRECTION 1: Récupérer les informations avec l'agrément inclus
    const reservation = await prisma.reservation.findFirst({
      where: {
        userId: userId,
        stageId: stageId
      },
      include: {
        stage: {
          include: {
            agrement: true // ✅ CRUCIAL : Inclure l'agrément
          }
        },
        user: true
      }
    });
    
    if (!reservation || !reservation.stage || !reservation.user) {
      return NextResponse.json({ 
        error: "Réservation non trouvée ou accès non autorisé",
        details: {
          reservationFound: !!reservation,
          stageFound: !!reservation?.stage,
          userFound: !!reservation?.user
        }
      }, { status: 404 });
    }

    // Vérifier que la réservation est payée (optionnel - à adapter selon vos règles)
    if (reservation.paid === false) {
      return NextResponse.json({ 
        error: "Veuillez régler votre réservation pour télécharger l'attestation" 
      }, { status: 402 }); // 402 Payment Required
    }

    const stage = reservation.stage;
    const user = reservation.user;

    // CORRECTION 2: Ajouter des logs de débogage
    console.log(`📄 Génération PDF avec jsPDF pour stage ${stageId}, utilisateur ${userId}, type: ${typeStage}`);
    console.log("🔍 Agrément du stage:", stage.agrement);
    
    // CORRECTION 3: Transformer les données en incluant l'agrément
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
      NumeroStage: stage.NumeroStage,
      agrement: stage.agrement
        ? {
            ...stage.agrement,
            nomDepartement: stage.agrement.nomDepartement ?? undefined
          }
        : null // ✅ AJOUT CRUCIAL : Inclure l'agrément avec nomDepartement corrigé
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

    // CORRECTION 4: Log supplémentaire avant génération
    console.log("🔍 Données stage envoyées au PDF:", {
      id: stageData.id,
      titre: stageData.Titre,
      numeroStage: stageData.NumeroStage,
      agrement: stageData.agrement
    });
    
    // Générer le PDF en utilisant la nouvelle fonction jsPDF
    const pdfBuffer = await generateReservationPDF(stageData, userData, reservationOptions);
    
    console.log(`✅ PDF généré avec succès avec jsPDF (${pdfBuffer.length} bytes)`);
    
    // Convertir le Buffer en Uint8Array pour compatibilité Web
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Nom de fichier descriptif avec le numéro de stage
    const filename = `convocation_stage_${stage.NumeroStage}_${user.lastName.toLowerCase()}_${user.firstName.toLowerCase()}.pdf`;

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
    console.error("❌ Erreur lors de la génération du PDF avec jsPDF:", error);
    
    // Log détaillé pour debugging
    console.error("Stack trace:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      userId,
      stageId,
      typeStage
    });
    
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

// Fonction POST pour une approche alternative (optionnel)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, stageId, typeStage } = body;
    
    if (!userId || !stageId) {
      return NextResponse.json({ 
        error: "userId et stageId sont requis" 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur demande ses propres documents
    if (userId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Rediriger vers la méthode GET avec les paramètres
    const url = new URL(request.url);
    url.searchParams.set('userId', userId.toString());
    url.searchParams.set('stageId', stageId.toString());
    if (typeStage) url.searchParams.set('typeStage', typeStage);
    
    // Pour une méthode POST, il vaut mieux traiter directement plutôt que rediriger
    // Appeler directement la logique de génération
    const getRequest = new Request(url.toString());
    return await GET(getRequest);
    
  } catch (error: any) {
    console.error("❌ Erreur lors du traitement de la requête POST:", error);
    return NextResponse.json({ 
      error: "Erreur lors du traitement de la requête POST",
      message: error.message 
    }, { status: 500 });
  }
}