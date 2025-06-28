// utils/invoiceGeneratorAlternative.ts
// Solution alternative en cas de problème avec PDFKit

import nodemailer from "nodemailer";

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

// Génération de la facture PDF avec configuration spécifique pour éviter les erreurs
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  // Import dynamique pour éviter les problèmes de polices
  const PDFDocument = require('pdfkit');
  
  // Configuration spéciale pour éviter les erreurs de polices
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    // Désactiver la recherche automatique de polices
    fontLayoutEngine: false
  });

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      console.log("✅ Facture PDF générée avec succès (méthode alternative)");
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', (err: Error) => {
      console.error("❌ Erreur lors de la génération de la facture :", err);
      reject(err);
    });

    try {
      // Configuration initiale - utiliser uniquement les polices de base
      doc.registerFont('Regular', require.resolve('pdfkit/js/data/Helvetica.afm'));
      doc.registerFont('Bold', require.resolve('pdfkit/js/data/Helvetica-Bold.afm'));
      
      // Si les polices ne sont pas disponibles, utiliser la police par défaut
      try {
        doc.font('Bold');
      } catch (fontError) {
        console.warn("Police Bold non disponible, utilisation de la police par défaut");
      }

      // En-tête de la facture
      doc.fontSize(16)
         .text('Facture acquittée N° ' + invoiceData.invoiceNumber, 50, 50);
      
      try {
        doc.font('Regular');
      } catch (fontError) {
        // Continuer sans changer de police
      }

      doc.fontSize(12)
         .text(new Date().toLocaleDateString('fr-FR', { 
           weekday: 'long', 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }), 50, 75);

      // Numéro client
      const clientNumber = `C${Date.now().toString().slice(-7)}`;
      doc.fontSize(10)
         .text(`Numéro client : ${clientNumber}`, 50, 95)
         .text('(A communiquer pour', 50, 110)
         .text('toute demande)', 50, 125);

      // Adresse client
      try {
        doc.font('Bold');
      } catch (fontError) {
        doc.fontSize(13); // Simuler le gras avec une taille plus grande
      }
      
      doc.fontSize(12)
         .text(`${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 50, 150);
      
      try {
        doc.font('Regular');
      } catch (fontError) {
        doc.fontSize(11); // Retour à la taille normale
      }
      
      doc.fontSize(11)
         .text(invoiceData.customer.address, 50, 170)
         .text(`${invoiceData.customer.postalCode} ${invoiceData.customer.city}`, 50, 190);

      // Tableau de facturation
      const tableTop = 230;
      
      // En-tête du tableau
      try {
        doc.font('Bold');
      } catch (fontError) {
        doc.fontSize(12); // Simuler le gras
      }
      
      doc.fontSize(11)
         .text('Désignation', 50, tableTop)
         .text('quantité', 400, tableTop)
         .text('Montant HT', 480, tableTop);

      // Ligne horizontale
      doc.moveTo(50, tableTop + 20)
         .lineTo(545, tableTop + 20)
         .stroke();

      // Retour à la police normale
      try {
        doc.font('Regular');
      } catch (fontError) {
        // Continuer sans changer de police
      }

      // Description du service
      const descriptionY = tableTop + 35;
      doc.fontSize(10)
         .text('Stage agréé de sensibilisation à la sécurité routière.', 50, descriptionY)
         .text(`Inscription : ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 50, descriptionY + 15);

      // Quantité et montant
      doc.text('1', 420, descriptionY)
         .text(`${invoiceData.stage.price.toFixed(2)} €`, 480, descriptionY);

      // Mode de règlement
      const paymentMethodText = invoiceData.payment.method === 'card' ? 'Carte Bancaire' : 
                               invoiceData.payment.method === 'transfer' ? 'Virement Bancaire' :
                               invoiceData.payment.method === 'check' ? 'Chèque' : 'Autre';
      
      doc.fontSize(11)
         .text(`Mode de Règlement : ${paymentMethodText}`, 50, descriptionY + 50);

      // Calculs des totaux
      const totalsY = descriptionY + 80;
      const priceHT = invoiceData.stage.price / 1.20;
      const tva = invoiceData.stage.price - priceHT;

      doc.fontSize(11)
         .text(`Total HT`, 400, totalsY)
         .text(`${priceHT.toFixed(2)} €`, 480, totalsY)
         .text(`TVA 20,00%`, 400, totalsY + 20)
         .text(`${tva.toFixed(2)} €`, 480, totalsY + 20);

      // Montant TTC en gras
      try {
        doc.font('Bold');
      } catch (fontError) {
        doc.fontSize(13); // Simuler le gras
      }
      
      doc.fontSize(12)
         .text(`Montant TTC`, 400, totalsY + 45)
         .text(`${invoiceData.stage.price.toFixed(2)} €`, 480, totalsY + 45);

      // Retour à la police normale
      try {
        doc.font('Regular');
      } catch (fontError) {
        // Continuer
      }

      // Mentions légales
      const footerY = totalsY + 90;
      doc.fontSize(8)
         .text('• L\'absence même partielle au stage ou le non respect des horaires ne permet pas la récupération de points.', 50, footerY)
         .text('• Lorsque le stage réunit moins de six personnes, la Préfecture impose à l\'organisateur l\'annulation du stage. Une autre date', 50, footerY + 15)
         .text('ou un transfert vers un autre lieu pourra vous être proposé sur votre demande.', 50, footerY + 30)
         .text('• Il vous appartient de vérifier (Préfecture ou lettre 48) que votre solde de points sur le fichier national du permis de', 50, footerY + 45)
         .text('conduire vous permet de récupérer 4 points.', 50, footerY + 60);

      // Pied de page
      const companyFooterY = footerY + 90;
      
      try {
        doc.font('Bold');
      } catch (fontError) {
        doc.fontSize(10); // Simuler le gras
      }
      
      doc.fontSize(9)
         .text('EG FORMATIONS', 50, companyFooterY);
      
      try {
        doc.font('Regular');
      } catch (fontError) {
        // Continuer
      }
      
      doc.text('- 61, rue Lyon - 75012 PARIS', 120, companyFooterY)
         .text('- N° SIRET 32803479800020 - Code APE 8553Z - Tva intra- communautaire FR24328034798 - Tél 0783372565', 50, companyFooterY + 15);

      doc.end();
      
    } catch (err) {
      console.error("❌ Exception pendant la génération de la facture :", err);
      reject(err);
    }
  });
}

// Version encore plus simple sans polices du tout
export async function generateSimpleInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
    // Aucune configuration de police
  });

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Utiliser uniquement la police par défaut sans aucune spécification
      
      // En-tête
      doc.fontSize(16)
         .text('Facture acquittée N° ' + invoiceData.invoiceNumber, 50, 50);
      
      doc.fontSize(12)
         .text(new Date().toLocaleDateString('fr-FR', { 
           weekday: 'long', 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }), 50, 75);

      const clientNumber = `C${Date.now().toString().slice(-7)}`;
      doc.fontSize(10)
         .text(`Numéro client : ${clientNumber}`, 50, 95)
         .text('(A communiquer pour toute demande)', 50, 110);

      // Client
      doc.fontSize(14) // Plus grand pour simuler le gras
         .text(`${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 50, 140);
      
      doc.fontSize(11)
         .text(invoiceData.customer.address, 50, 160)
         .text(`${invoiceData.customer.postalCode} ${invoiceData.customer.city}`, 50, 180);

      // Tableau
      const tableTop = 220;
      doc.fontSize(12) // Plus grand pour l'en-tête
         .text('Désignation', 50, tableTop)
         .text('Qté', 400, tableTop)
         .text('Montant HT', 480, tableTop);

      doc.moveTo(50, tableTop + 20)
         .lineTo(545, tableTop + 20)
         .stroke();

      const descriptionY = tableTop + 35;
      doc.fontSize(10)
         .text('Stage agréé de sensibilisation à la sécurité routière.', 50, descriptionY)
         .text(`Inscription : ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, 50, descriptionY + 15)
         .text('1', 420, descriptionY)
         .text(`${invoiceData.stage.price.toFixed(2)} €`, 480, descriptionY);

      const paymentMethodText = invoiceData.payment.method === 'card' ? 'Carte Bancaire' : 
                               invoiceData.payment.method === 'transfer' ? 'Virement Bancaire' :
                               invoiceData.payment.method === 'check' ? 'Chèque' : 'Autre';
      
      doc.fontSize(11)
         .text(`Mode de Règlement : ${paymentMethodText}`, 50, descriptionY + 50);

      // Totaux
      const totalsY = descriptionY + 80;
      const priceHT = invoiceData.stage.price / 1.20;
      const tva = invoiceData.stage.price - priceHT;

      doc.fontSize(11)
         .text(`Total HT`, 400, totalsY)
         .text(`${priceHT.toFixed(2)} €`, 480, totalsY)
         .text(`TVA 20,00%`, 400, totalsY + 20)
         .text(`${tva.toFixed(2)} €`, 480, totalsY + 20);

      doc.fontSize(14) // Plus grand pour le total
         .text(`Montant TTC`, 400, totalsY + 45)
         .text(`${invoiceData.stage.price.toFixed(2)} €`, 480, totalsY + 45);

      // Mentions légales
      const footerY = totalsY + 90;
      doc.fontSize(8)
         .text('• L\'absence même partielle au stage ou le non respect des horaires ne permet pas la récupération de points.', 50, footerY)
         .text('• Lorsque le stage réunit moins de six personnes, la Préfecture impose à l\'organisateur l\'annulation du stage.', 50, footerY + 15)
         .text('• Il vous appartient de vérifier que votre solde de points vous permet de récupérer 4 points.', 50, footerY + 30);

      // Pied de page
      const companyFooterY = footerY + 60;
      doc.fontSize(10)
         .text('EG FORMATIONS - 61, rue Lyon - 75012 PARIS', 50, companyFooterY)
         .fontSize(8)
         .text('SIRET: 32803479800020 - Code APE 8553Z - TVA: FR24328034798 - Tél: 0783372565', 50, companyFooterY + 15);

      doc.end();
      
    } catch (err) {
      reject(err);
    }
  });
}

// Utiliser cette fonction pour la sauvegarde et l'envoi
export async function processInvoiceAfterPayment(
  reservationId: number,
  stripePaymentId: string,
  amount: number,
  currency: string = 'EUR'
) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true, stage: true }
    });

    if (!reservation || !reservation.user || !reservation.stage) {
      throw new Error("Réservation non trouvée");
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      date: new Date(),
      dueDate: new Date(),
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
        amount: amount / 100,
        currency,
        paymentDate: new Date(),
        method: reservation.paymentMethod || 'card'
      }
    };

    // Essayer d'abord la version normale, puis la version simple en cas d'erreur
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.warn("Première méthode échouée, essai de la méthode simple...");
      pdfBuffer = await generateSimpleInvoicePDF(invoiceData);
    }

    // Sauvegarder en base (vous devez copier cette fonction depuis l'autre fichier)
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
        userId: reservation.userId,
        reservationId: reservationId
      }
    });

    console.log("✅ Facture complètement traitée:", invoiceData.invoiceNumber);
    return {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceId: invoice.id
    };

  } catch (error) {
    console.error("❌ Erreur lors du traitement de la facture:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}