// utils/invoiceGeneratorJsPDF.ts
import nodemailer from "nodemailer";
import { formatDateShortFR } from "@/app/utils/dateUtils";

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    postalCode: string;
    city: string;
  };
  stage: {
    title: string;
    date: Date;
    price: number;
    numeroStage: string;
  };
  payment: {
    stripePaymentId: string;
    amount: number;
    currency: string;
    paymentDate: Date;
    method: string;
  };
}

// Générateur de numéro de facture
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString();
  const shortTimestamp = timestamp.slice(-5);
  const longTimestamp = timestamp.slice(-9);
  return `PAP/${year}/${month}/${shortTimestamp}-${longTimestamp}`;
}

// Génération de la facture PDF avec jsPDF
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  // Import dynamique de jsPDF
  const { jsPDF } = await import('jspdf');
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Configuration de base
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 20;

      // En-tête de la facture
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Facture acquittée N° ' + invoiceData.invoiceNumber, 20, currentY);
      currentY += 10;

      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(dateStr, 20, currentY);
      currentY += 15;

      // Numéro client
      const clientNumber = `C${Date.now().toString().slice(-7)}`;
      doc.setFontSize(10);
      doc.text(`Numéro client : ${clientNumber}`, 20, currentY);
      currentY += 5;
      doc.text('(A communiquer pour', 20, currentY);
      currentY += 5;
      doc.text('toute demande)', 20, currentY);
      currentY += 15;

      // Adresse client
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(invoiceData.customer.address, 20, currentY);
      currentY += 6;
      doc.text(`${invoiceData.customer.postalCode} ${invoiceData.customer.city}`, 20, currentY);
      currentY += 20;

      // Tableau de facturation
      const tableTop = currentY;
      
      // En-tête du tableau
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Désignation', 20, tableTop);
      doc.text('quantité', 140, tableTop);
      doc.text('Montant HT', 170, tableTop);

      // Ligne horizontale
      doc.line(20, tableTop + 5, pageWidth - 20, tableTop + 5);
      currentY = tableTop + 15;

      // Description du service
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Stage agréé de sensibilisation à la sécurité routière.', 20, currentY);
      currentY += 6;
      doc.text(`Inscription : ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 20, currentY);

      // Quantité et montant (alignés avec l'en-tête)
      doc.text('1', 140, currentY - 6);
      doc.text(`${invoiceData.stage.price.toFixed(2)} €`, 170, currentY - 6);
      currentY += 15;

      // Mode de règlement
      const paymentMethodText = invoiceData.payment.method === 'card' ? 'Carte Bancaire' : 
                               invoiceData.payment.method === 'transfer' ? 'Virement Bancaire' :
                               invoiceData.payment.method === 'check' ? 'Chèque' : 'Autre';
      
      doc.setFontSize(11);
      doc.text(`Mode de Règlement : ${paymentMethodText}`, 20, currentY);
      currentY += 20;

      // Calculs des totaux
      const priceHT = invoiceData.stage.price / 1.20;
      const tva = invoiceData.stage.price - priceHT;

      // Positionnement des totaux à droite
      const rightAlign = 140;
      const amountAlign = 170;

      doc.setFontSize(11);
      doc.text('Total HT', rightAlign, currentY);
      doc.text(`${priceHT.toFixed(2)} €`, amountAlign, currentY);
      currentY += 8;

      doc.text('TVA 20,00%', rightAlign, currentY);
      doc.text(`${tva.toFixed(2)} €`, amountAlign, currentY);
      currentY += 8;

      // Montant TTC en gras
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Montant TTC', rightAlign, currentY);
      doc.text(`${invoiceData.stage.price.toFixed(2)} €`, amountAlign, currentY);
      currentY += 25;

      // Mentions légales
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      const mentions = [
        '• L\'absence même partielle au stage ou le non respect des horaires ne permet pas la récupération de points.',
        '• Lorsque le stage réunit moins de six personnes, la Préfecture impose à l\'organisateur l\'annulation du stage. Une autre date',
        'ou un transfert vers un autre lieu pourra vous être proposé sur votre demande.',
        '• Il vous appartient de vérifier (Préfecture ou lettre 48) que votre solde de points sur le fichier national du permis de',
        'conduire vous permet de récupérer 4 points.'
      ];

      mentions.forEach((mention, index) => {
        doc.text(mention, 20, currentY + (index * 5));
      });
      currentY += 30;

      // Pied de page avec informations entreprise
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EG FORMATIONS', 20, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.text('- 61, rue Lyon - 75012 PARIS', 50, currentY);
      currentY += 6;
      doc.text('- N° SIRET 32803479800020 - Code APE 8553Z - Tva intra- communautaire FR24328034798 - Tél 0783372565', 20, currentY);

      // Convertir en Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log("✅ Facture PDF générée avec succès (jsPDF)");
      resolve(pdfBuffer);
      
    } catch (err) {
      console.error("❌ Exception pendant la génération de la facture :", err);
      reject(err);
    }
  });
}

// Sauvegarde en base de données
export async function saveInvoiceToDatabase(invoiceData: InvoiceData, pdfBuffer: Buffer, userId: number, reservationId?: number) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.stage.price,
        currency: invoiceData.payment.currency,
        status: 'paid',
        customerEmail: invoiceData.customer.email,
        customerName: `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`,
        stripePaymentId: invoiceData.payment.stripePaymentId,
        pdfData: pdfBuffer,
        createdAt: new Date(),
        dueDate: invoiceData.dueDate,
        userId: userId,
        reservationId: reservationId
      }
    });

    console.log("✅ Facture sauvegardée en base:", invoice.invoiceNumber);
    return invoice;
  } catch (error) {
    console.error("❌ Erreur sauvegarde facture:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Envoi de la facture par email
export async function sendInvoiceByEmail(invoiceData: InvoiceData, pdfBuffer: Buffer) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  const emailContent = `
Bonjour ${invoiceData.customer.firstName} ${invoiceData.customer.lastName},

Nous vous remercions pour votre paiement de ${invoiceData.stage.price}€ pour le stage de sécurité routière.

Vous trouverez ci-joint votre facture n° ${invoiceData.invoiceNumber}.

📋 Détails du stage :
• Titre : ${invoiceData.stage.title}
• Date : ${formatDateShortFR(invoiceData.stage.date)}
• Numéro de stage : ${invoiceData.stage.numeroStage}
• Montant : ${invoiceData.stage.price}€

✅ Paiement confirmé le ${formatDateShortFR(invoiceData.payment.paymentDate)}

Pour toute question, n'hésitez pas à nous contacter au 07 83 37 25 65.

Cordialement,
L'équipe EG-FORMATIONS
  `;

  await transporter.sendMail({
    from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    subject: `Facture ${invoiceData.invoiceNumber} - Stage de sécurité routière`,
    text: emailContent,
    html: emailContent.replace(/\n/g, '<br>'),
    attachments: [
      {
        filename: `facture_${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("✅ Facture envoyée par email à:", process.env.MAIL_USER);
}

// Fonction principale pour générer et envoyer la facture après paiement
export async function processInvoiceAfterPaymentAdmin(
  reservationId: number,
  stripePaymentId: string,
  amount: number,
  currency: string = 'EUR'
) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Récupérer les données de la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        stage: true
      }
    });

    if (!reservation || !reservation.user || !reservation.stage) {
      throw new Error("Réservation non trouvée");
    }

    // Préparer les données de la facture
    const invoiceData: InvoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      date: new Date(),
      dueDate: new Date(), // Payé immédiatement
      customer: {
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        email: reservation.user.email,
        address: reservation.user.address1 || '',
        postalCode: reservation.user.postalCode || '',
        city: reservation.user.city || ''
      },
      stage: {
        title: reservation.stage.Titre,
        date: reservation.stage.DateDebut,
        price: reservation.stage.Prix,
        numeroStage: reservation.stage.NumeroStage
      },
      payment: {
        stripePaymentId,
        amount: amount / 100, // Stripe renvoie en centimes
        currency,
        paymentDate: new Date(),
        method: reservation.paymentMethod || 'card'
      }
    };

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Sauvegarder en base
    const savedInvoice = await saveInvoiceToDatabase(invoiceData, pdfBuffer, reservation.userId, reservationId);

    // Envoyer par email
    await sendInvoiceByEmail(invoiceData, pdfBuffer);

    console.log("✅ Facture complètement traitée:", invoiceData.invoiceNumber);
    return {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceId: savedInvoice.id
    };

  } catch (error) {
    console.error("❌ Erreur lors du traitement de la facture:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}