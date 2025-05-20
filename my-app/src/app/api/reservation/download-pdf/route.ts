// app/api/reservation/download-pdf/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import path from "path";

const prisma = new PrismaClient();

// Fonction helper pour formater le type de stage
function formatTypeStage(type: string): string {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire"
  };
  
  return types[type] || type;
}

// Génère un PDF avec la police OpenSansHebrew-Light.ttf
async function generateReservationPDF(stage: any, userEmail: string, typeStage: string): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "OpenSansHebrew-Light.ttf");

  const doc = new PDFDocument({
    autoFirstPage: false,
    font: fontPath  // Définit la police par défaut dès la création
  });

  const chunks: any[] = [];

  if (!fontPath) {
    throw new Error("Le chemin de la police est introuvable");
  }
  
  console.log("📄 Génération du PDF avec la police :", fontPath);
  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      console.log("✅ Flux PDF terminé");
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", (err) => {
      console.error("❌ Erreur lors de la génération du PDF :", err);
      reject(err);
    });

    try {
      // Étape CRUCIALE : enregistrer la police AVANT toute écriture
      doc.registerFont("OpenSans", fontPath);

      // Crée une première page après avoir enregistré la font
      doc.addPage();
      doc.font("OpenSans");

      doc.fontSize(20).text("Confirmation de réservation", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Stage : ${stage.Titre}`);
      doc.text(`Type de stage : ${formatTypeStage(typeStage)}`);
      doc.text(`Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}`);
      doc.text(`Dates : du ${new Date(stage.DateDebut).toLocaleDateString()} au ${new Date(stage.DateFin).toLocaleDateString()}`);
      doc.text(`Heures : ${stage.HeureDebut} - ${stage.HeureFin} / ${stage.HeureDebut2} - ${stage.HeureFin2}`);
      doc.text(`Prix : ${stage.Prix} €`);
      doc.text(`Email participant : ${userEmail}`);
      doc.moveDown();
      doc.fontSize(12).text("Conservez précieusement ce document et présentez-le le jour de votre stage.", { align: "center" });
      doc.end();
    } catch (err) {
      console.error("❌ Exception pendant l'écriture du PDF :", err);
      reject(err);
    }
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  const stageId = Number(searchParams.get('stageId'));
  const typeStage = searchParams.get('typeStage') || "stage";
  
  if (!userId || !stageId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
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
      return NextResponse.json({ error: "Stage ou utilisateur non trouvé" }, { status: 404 });
    }
    
    // Générer le PDF
    const pdfBuffer = await generateReservationPDF(stage, user.email, typeStage);
    
    // Convertir le Buffer Node.js en Uint8Array pour compatibilité Web
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Renvoyer le PDF avec les headers appropriés
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="confirmation_reservation_${stageId}.pdf"`,
      }
    });
    
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}