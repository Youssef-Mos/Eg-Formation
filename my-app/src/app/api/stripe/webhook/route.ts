import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { buffer } from "micro";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import path from "path";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Génère un PDF avec la police OpenSansHebrew-Light.ttf
async function generateReservationPDF(stage: any, userEmail: string): Promise<Buffer> {
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
        doc.text(`Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}`);
        doc.text(`Dates : du ${new Date(stage.DateDebut).toLocaleDateString()} au ${new Date(stage.DateFin).toLocaleDateString()}`);
        doc.text(`Heures : ${stage.HeureDebut} - ${stage.HeureFin} / ${stage.HeureDebut2} - ${stage.HeureFin2}`);
        doc.text(`Prix : ${stage.Prix} €`);
        doc.text(`Email participant : ${userEmail}`);
        doc.end();
      } catch (err) {
        console.error("❌ Exception pendant l’écriture du PDF :", err);
        reject(err);
      }
    });
  }
  

// Envoie l'e-mail avec PDF joint
async function sendConfirmationEmail(email: string, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  await transporter.sendMail({
    from: `"Eg-Formation" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Votre réservation de stage - Confirmation",
    text: "Merci pour votre réservation ! Veuillez trouver ci-joint votre confirmation au format PDF.",
    attachments: [
      {
        filename: "confirmation_reservation.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("📦 Session metadata :", session.metadata);

    const userId = Number(session.metadata?.userId);
    const stageId = Number(session.metadata?.stageId);

    if (!userId || !stageId) {
      console.error("❌ Metadata manquante dans Stripe session");
      return new NextResponse("Missing metadata", { status: 400 });
    }

    try {
      const existingReservation = await prisma.reservation.findUnique({
        where: {
          userId_stageId: { userId, stageId },
        },
      });

      if (!existingReservation) {
        // 1. Créer réservation
        await prisma.reservation.create({
          data: { userId, stageId },
        });
        console.log("✅ Réservation ajoutée");

        // 2. Décrémenter la place
        const stage = await prisma.stage.findUnique({ where: { id: stageId } });
        if (stage && stage.PlaceDisponibles > 0) {
          await prisma.stage.update({
            where: { id: stageId },
            data: { PlaceDisponibles: { decrement: 1 } },
          });
          console.log("✅ Place mise à jour");
        } else {
          console.warn("⚠️ Stage complet ou introuvable, pas de décrément");
        }

        // 3. Générer PDF et envoyer e-mail
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !stage) {
          console.error("❌ Utilisateur ou stage introuvable pour l'envoi");
          return new NextResponse("User or Stage not found", { status: 400 });
        }

        try {
          console.log("📄 Génération du PDF...");
          const pdf = await generateReservationPDF(stage, user.email);

          console.log("📨 Envoi de l'e-mail...");
          await sendConfirmationEmail(user.email, pdf);

          console.log("📧 Email envoyé à", user.email);
        } catch (err) {
          console.error("❌ Erreur PDF/email :", err);
        }
      } else {
        console.log("ℹ️ Réservation déjà existante");
      }
    } catch (error) {
      console.error("❌ Erreur traitement paiement :", error);
      return new NextResponse("Database Error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}
