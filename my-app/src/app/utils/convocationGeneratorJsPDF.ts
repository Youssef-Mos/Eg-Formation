// utils/convocationGeneratorJsPDF.ts
import nodemailer from "nodemailer";
import { createSafeDate, formatDateLongFR, formatDateForEmail } from "@/app/utils/dateUtils";
interface User {
  firstName: string;
  lastName: string;
  email: string;
  id: number;
}

interface Agrement {
  id: number;
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
}

interface Stage {
  id: number;
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  DateDebut: Date;
  DateFin: Date;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  NumeroStage: string;
  agrement?: Agrement | null;
}

interface ReservationOptions {
  stageType: 1 | 2 | 3 | 4;
}

// Fonction pour charger une image et la convertir en base64
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    // En environnement serveur, on utilise fetch pour charger l'image
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${imagePath}`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de l'image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Déterminer le type MIME en fonction de l'extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' : 
                     extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                     'image/png'; // par défaut
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement du logo:', error);
    return ''; // Retourner une chaîne vide si l'image ne peut pas être chargée
  }
}

// Génère un numéro de client unique
function generateClientNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ✅ FONCTION UTILITAIRE - Parse une date de façon sûre sans problème de timezone
function parseDateSafely(dateInput: Date | string): Date {
   // Utilise createSafeDate pour éviter tout problème de fuseau horaire
  return createSafeDate(dateInput);
}

// ✅ FONCTION CORRIGÉE - Formate une date en français sans problème de fuseau horaire
// ✅ DANS utils/convocationGeneratorJsPDF.ts
function formatDateFR(dateInput: Date | string): string {
  return formatDateLongFR(dateInput);
}

// Génère le PDF de convocation avec jsPDF et logo
export async function generateReservationPDF(stage: Stage, user: User, options: ReservationOptions): Promise<Buffer> {
  // Import dynamique de jsPDF
  const { jsPDF } = await import('jspdf');
  
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();
      const clientNumber = generateClientNumber();
      
      // Configuration de base
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxContentHeight = pageHeight - 40;
      let currentY = 15;

      // Fonction pour vérifier et gérer le passage à la page suivante
      const checkPageBreak = (spaceNeeded: number) => {
        if (currentY + spaceNeeded > maxContentHeight) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // ✨ AJOUT DU LOGO EN HAUT
      try {
        console.log('🖼️ Chargement du logo...');
        const logoBase64 = await loadImageAsBase64('/image/logo/LogoNav.png'); // ✅ Ton chemin correct
        
        if (logoBase64) {
          // Dimensions du logo (à ajuster selon ton logo)
          const logoWidth = 40;  // Largeur en mm
          const logoHeight = 20; // Hauteur en mm
          const logoX = (pageWidth - logoWidth) / 2; // Centré
          const logoY = currentY;
          
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
          currentY += logoHeight + 10; // Espace après le logo
          console.log('✅ Logo ajouté avec succès');
        } else {
          console.log('⚠️ Logo non chargé, continuation sans logo');
          currentY += 5; // Petit espace même sans logo
        }
      } catch (logoError) {
        console.warn('⚠️ Erreur logo, continuation sans logo:', logoError);
        currentY += 5; // Petit espace même sans logo
      }

      // Date actuelle en haut à droite
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(currentDate, pageWidth - margin, currentY, { align: 'right' });
      currentY += 20;

      // Titre principal
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CONVOCATION A UN STAGE DE SECURITE ROUTIERE', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Inscription confirmée
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inscription confirmée', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Numéro de client
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`N° de client : ${clientNumber}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
      
      doc.setFontSize(10);
      doc.text('(A communiquer pour toute demande)', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Nom du stagiaire
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${user.lastName.toUpperCase()} ${user.firstName}`, margin, currentY);
      currentY += 15;

      // Message de bienvenue
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bonjour ${user.lastName.toUpperCase()} ${user.firstName} et merci de votre confiance.`, margin, currentY);
      currentY += 8;
      doc.text('Nous vous confirmons votre inscription à un stage de sécurité routière.', margin, currentY);
      currentY += 15;

      // Lieu et horaires du stage
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Lieu et horaires du stage :', margin, currentY);
      currentY += 10;

      // Utilisation dynamique de l'agrément s'il existe
      doc.setFont('helvetica', 'normal');
      if (stage.agrement && stage.agrement.numeroAgrement) {
        const agrementText = `Stage agréé par le Préfet ${stage.agrement.nomDepartement ? `du ${stage.agrement.nomDepartement}` : `(${stage.agrement.departement})`}, agrément n° ${stage.agrement.numeroAgrement} :`;
        doc.text(agrementText, margin, currentY);
      } else {
        doc.text('Stage agréé par le Préfet, agrément n° [À définir] :', margin, currentY);
      }
      currentY += 10;

     // ✅ CORRECTION : Détails des dates et horaires avec formatage sûr
      doc.text(`${formatDateFR(stage.DateDebut)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}`, margin, currentY);
      currentY += 6;
      doc.text(`${formatDateFR(stage.DateFin)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}, à l'adresse suivante :`, margin, currentY);
      currentY += 10;

      // Adresse du stage
      doc.setFont('helvetica', 'bold');
      doc.text(stage.Titre.toUpperCase(), margin, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(stage.Adresse, margin, currentY);
      currentY += 6;
      doc.text(`${stage.CodePostal} ${stage.Ville}`, margin, currentY);
      currentY += 10;

      // Numéro de stage
      doc.setFont('helvetica', 'bold');
      doc.text(`Numéro de stage : ${stage.NumeroStage}`, margin, currentY);
      currentY += 15;

      // Affichage supplémentaire de l'agrément si disponible
      if (stage.agrement) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Agrément : ${stage.agrement.numeroAgrement}`, margin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Département : ${stage.agrement.departement}${stage.agrement.nomDepartement ? ` (${stage.agrement.nomDepartement})` : ''}`, margin, currentY);
        currentY += 15;
      }

      // Obligations
      doc.setFont('helvetica', 'bold');
      doc.text('Votre présence et le respect des horaires sont obligatoires.', margin, currentY);
      currentY += 15;

      // Documents à apporter
      doc.setFont('helvetica', 'bold');
      doc.text('Merci de vous munir le jour du stage :', margin, currentY);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('- De votre permis de conduire et de votre pièce d\'identité.', margin, currentY);
      currentY += 15;

      // Complément de dossier
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.text('Complément de dossier :', margin, currentY);
      currentY += 10;
      
      doc.setFont('helvetica', 'normal');
      const complementText = 'Pièces indispensables car exigées par la Préfecture pour la validation de votre stage. Pièces à présenter à l\'organisateur le jour du stage.';
      const splitComplementText = doc.splitTextToSize(complementText, pageWidth - 2 * margin);
      doc.text(splitComplementText, margin, currentY);
      currentY += splitComplementText.length * 5 + 10;

      // Section dynamique selon le type de stage - AVEC ENCADRÉ
      checkPageBreak(35);
      const boxX = margin;
      const boxY = currentY;
      const boxWidth = pageWidth - 2 * margin;
      let boxHeight = 25;

      let stageTypeLines = 2;
      if (options.stageType === 2 || options.stageType === 3 || options.stageType === 4) {
        stageTypeLines = 3;
        boxHeight = 30;
      }

      checkPageBreak(boxHeight + 10);

      // Dessiner l'encadré pour le type de stage choisi
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(boxX, currentY, boxWidth, boxHeight);

      currentY += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(`Cas n° ${options.stageType} :`, margin + 5, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'normal');
      if (options.stageType === 1) {
        doc.text('Votre pièce d\'identité,', margin + 5, currentY);
        currentY += 5;
        doc.text('Cette convocation (en version papier ou sur votre smartphone).', margin + 5, currentY);
      } else if (options.stageType === 2) {
        doc.text('Lettre 48N reçue de la Préfecture,', margin + 5, currentY);
        currentY += 5;
        doc.text('Votre pièce d\'identité,', margin + 5, currentY);
        currentY += 5;
        doc.text('Cette convocation (en version papier ou sur votre smartphone).', margin + 5, currentY);
      } else if (options.stageType === 3) {
        doc.text('Document transmis par le tribunal,', margin + 5, currentY);
        currentY += 5;
        doc.text('Votre pièce d\'identité,', margin + 5, currentY);
        currentY += 5;
        doc.text('Cette convocation (en version papier ou sur votre smartphone).', margin + 5, currentY);
      } else if (options.stageType === 4) {
        doc.text('Document de justice (sursis avec mise à l\'épreuve),', margin + 5, currentY);
        currentY += 5;
        doc.text('Votre pièce d\'identité,', margin + 5, currentY);
        currentY += 5;
        doc.text('Cette convocation (en version papier ou sur votre smartphone).', margin + 5, currentY);
      }

      currentY = boxY + boxHeight + 15;

      // Cas différents (description)
      checkPageBreak(40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const casDescriptions = [
        'Cas 1 : Stage volontaire - Récupération de 4 points (art. L. 223-6 alinéa 2 et R. 223-8 du code de la route).',
        'Cas 2 : Stage obligatoire pour les conducteurs en période probatoire dans le cadre d\'une perte d\'au moins 3 points.(art. L. 223-6 et R. 223-4 du code de la route).',
        'Cas 3 : Stage en alternative à la poursuite judiciaire proposé par le Procureur de la République ou en exécution d\'une composition pénale (2° de l\'art. 41-1 et 5° de l\'article 41-2 du code de procédure pénale).',
        'Cas 4 : Peine complémentaire ou obligation imposée dans le cadre du sursis avec mise à l\'épreuve (art.131-35-1 et R.132-45 du code pénal).'
      ];

      casDescriptions.forEach((cas, index) => {
        const splitCas = doc.splitTextToSize(cas, pageWidth - 2 * margin);
        const neededSpace = splitCas.length * 3.5 + 2;
        
        checkPageBreak(neededSpace);
        doc.text(splitCas, margin, currentY);
        currentY += neededSpace;
      });

      currentY += 10;

      // Informations importantes
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Informations importantes :', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const importantTexts = [
        'Il est de votre responsabilité de vérifier (Préfecture, lettre 48 ou Telepoints) que votre solde de points sur le fichier national du permis de conduire vous permet de récupérer 4 points et que votre participation à un stage volontaire (cas1) date de plus de 1 an. En cas de litige, EG FORMATIONS ne peut être tenu responsable.',
        'Lorsque le stage réunit moins de six personnes, la Préfecture impose à l\'organisateur, l\'annulation du stage. Le centre agréé EG FORMATIONS est tenu de vous informer de cette annulation par tous les moyens mis à sa disposition. En contactant la société "EG FORMATIONS" au 0783372565, une autre date ou un transfert vers un autre lieu pourra donc vous être proposé sur votre demande.',
        'Vous pouvez changer la date de votre réservation ou annuler votre inscription au plus tard sept jours avant la date du stage. Passé ce délai, des frais complémentaires vous seront facturés pour un montant de 50€ TTC. En cas d\'annulation ou de transfert deux jours avant la formation, le coût du stage reste dû. Il ne sera alors procédé à aucun remboursement.'
      ];

      const boldText = 'L\'absence même partielle au stage ou le non respect des horaires ne permet pas la récupération de points.';
      
      // Premier texte
      const splitText1 = doc.splitTextToSize(importantTexts[0], pageWidth - 2 * margin);
      const neededSpace1 = splitText1.length * 3.5 + 8;
      checkPageBreak(neededSpace1);
      doc.text(splitText1, margin, currentY);
      currentY += neededSpace1;

      // Deuxième texte
      const splitText2 = doc.splitTextToSize(importantTexts[1], pageWidth - 2 * margin);
      const neededSpace2 = splitText2.length * 3.5 + 8;
      checkPageBreak(neededSpace2);
      doc.text(splitText2, margin, currentY);
      currentY += neededSpace2;

      // Phrase en gras
      const splitBold = doc.splitTextToSize(boldText, pageWidth - 2 * margin);
      const neededSpaceBold = splitBold.length * 3.5 + 8;
      checkPageBreak(neededSpaceBold);
      doc.setFont('helvetica', 'bold');
      doc.text(splitBold, margin, currentY);
      currentY += neededSpaceBold;
      doc.setFont('helvetica', 'normal');

      // Troisième texte
      const splitText3 = doc.splitTextToSize(importantTexts[2], pageWidth - 2 * margin);
      const neededSpace3 = splitText3.length * 3.5 + 15;
      checkPageBreak(neededSpace3);
      doc.text(splitText3, margin, currentY);
      currentY += neededSpace3;

      // Informations légales en bas de page
      checkPageBreak(20);
      
      const legalY = Math.max(currentY, pageHeight - 25);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('N° SIRET 32803479800020 - Code APE 8553Z - RCS - TVA intra communautaire FR24328034798', pageWidth / 2, legalY, { align: 'center' });

      // Convertir en Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log("✅ PDF de convocation avec logo généré avec succès (jsPDF)");
      resolve(pdfBuffer);
      
    } catch (err) {
      console.error("❌ Exception pendant la génération du PDF :", err);
      reject(err);
    }
  });
}

// Envoie l'e-mail avec PDF joint (reste identique)
// ✅ FONCTION EMAIL CORRIGÉE
export async function sendConfirmationEmail(user: User, stage: Stage, options: ReservationOptions) {
  const pdfBuffer = await generateReservationPDF(stage, user, options);
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  const stageTypeDescriptions = {
    1: "Stage volontaire - Récupération de 4 points",
    2: "Stage obligatoire (période probatoire)",
    3: "Stage en alternative à la poursuite judiciaire",
    4: "Peine complémentaire ou sursis avec mise à l'épreuve"
  };

  const agrementInfo = stage.agrement 
    ? `\n🏛️ Agrément : ${stage.agrement.numeroAgrement} (${stage.agrement.departement}${stage.agrement.nomDepartement ? ` - ${stage.agrement.nomDepartement}` : ''})`
    : '';

  const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

Nous vous confirmons votre inscription au stage de sécurité routière suivant :

📍 Lieu : ${stage.Titre}
📍 Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}
📅 Dates : du ${formatDateForEmail(stage.DateDebut)} au ${formatDateForEmail(stage.DateFin)}
⏰ Horaires : ${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}
🔢 Numéro de stage : ${stage.NumeroStage}${agrementInfo}
💰 Prix : ${stage.Prix}€
📋 Type : ${stageTypeDescriptions[options.stageType]}

Votre convocation officielle est jointe à cet e-mail en format PDF.

IMPORTANT : 
- Votre présence et le respect des horaires sont obligatoires
- Munissez-vous de votre permis de conduire et de votre pièce d'identité
- Présentez cette convocation le jour du stage
${options.stageType === 2 ? '- N\'oubliez pas la lettre 48N de la Préfecture' : ''}
${options.stageType === 3 ? '- N\'oubliez pas le document transmis par le tribunal' : ''}
${options.stageType === 4 ? '- N\'oubliez pas le document de justice (sursis avec mise à l\'épreuve)' : ''}

Pour toute question, contactez-nous au 0783372565.

Cordialement,
L'équipe EG-FORMATIONS
  `;

  await transporter.sendMail({
    from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
    to: user.email,
    cc: process.env.MAIL_USER, // ✅ CC automatique au propriétaire
    subject: `Convocation stage de sécurité routière - ${stage.Ville}`,
    text: emailContent,
    html: emailContent.replace(/\n/g, '<br>'),
    attachments: [
      {
        filename: `convocation_stage_${stage.NumeroStage}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log(`✅ Convocation avec logo envoyée par email à: ${user.email} (copie à: ${process.env.MAIL_USER})`);
}