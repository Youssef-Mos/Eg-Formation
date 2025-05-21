// app/api/webhook/utils.ts
import PDFDocument from "pdfkit";
import path from "path";
import nodemailer from "nodemailer";

// Génère un PDF avec la police OpenSansHebrew-Light.ttf
export async function generateReservationPDF(stage: any, userEmail: string): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "OpenSansHebrew-Light.ttf");

  const doc = new PDFDocument({
    autoFirstPage: false,
    font: fontPath
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
      doc.text(`Heures : ${stage.HeureDebut} - ${stage.HeureFin} / ${stage.HeureDebut2 || ''} - ${stage.HeureFin2 || ''}`);
      doc.text(`Prix : ${stage.Prix} €`);
      doc.text(`Email participant : ${userEmail}`);
      doc.end();
    } catch (err) {
      console.error("❌ Exception pendant l'écriture du PDF :", err);
      reject(err);
    }
  });
}

// Envoie l'e-mail avec PDF joint
export async function sendConfirmationEmail(email: string, pdfBuffer: Buffer) {
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