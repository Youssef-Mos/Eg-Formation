// app/api/webhook/utils.ts
import PDFDocument from "pdfkit";
import path from "path";
import nodemailer from "nodemailer";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  id: number;
}

// Exemple d'utilisation :
/*
// Cas 1 : Stage volontaire
await sendConfirmationEmail(user, stage, { stageType: 1 });

// Cas 2 : Stage obligatoire probatoire  
await sendConfirmationEmail(user, stage, { stageType: 2 });

// Cas 3 : Stage tribunal (avec documents spécifiques)
await sendConfirmationEmail(user, stage, { stageType: 3 });

// Cas 4 : Peine complémentaire
await sendConfirmationEmail(user, stage, { stageType: 4 });
*/

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
}

interface ReservationOptions {
  stageType: 1 | 2 | 3 | 4; // Type de stage (1: volontaire, 2: probatoire, 3: tribunal, 4: peine complémentaire)
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

// Formate une date en français
function formatDateFR(date: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName} ${day} ${month} ${year}`;
}

// Génère le PDF de convocation
export async function generateReservationPDF(stage: Stage, user: User, options: ReservationOptions): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "OpenSansHebrew-Light.ttf");
  const clientNumber = generateClientNumber();
  
  const doc = new PDFDocument({
    autoFirstPage: false,
    font: fontPath  // Définit la police par défaut dès la création - CRUCIAL pour éviter Helvetica
  });

  const chunks: any[] = [];

  if (!fontPath) {
    throw new Error("Le chemin de la police est introuvable");
  }
  
  console.log("📄 Génération du PDF avec la police :", fontPath);

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      console.log("✅ PDF de convocation généré avec succès");
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", (err) => {
      console.error("❌ Erreur lors de la génération du PDF :", err);
      reject(err);
    });

    try {
      // Étape CRUCIALE : enregistrer la police AVANT toute écriture
      doc.registerFont("OpenSans", fontPath);
      doc.registerFont("OpenSans-Bold", fontPath); // Utiliser la même police pour le bold

      // Crée une première page après avoir enregistré la font
      doc.addPage();
      doc.font("OpenSans");

      // Date actuelle en haut à droite
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.fontSize(10)
         .text(currentDate, { align: 'right' });

      doc.moveDown(2);

      // Titre principal
      doc.fontSize(16)
         .font("OpenSans-Bold")
         .text('CONVOCATION A UN STAGE DE SECURITE ROUTIERE', { align: 'center' });

      doc.moveDown(1);

      // Inscription confirmée
      doc.fontSize(14)
         .font("OpenSans-Bold")
         .text('Inscription confirmée', { align: 'center' });

      doc.moveDown(1);

      // Numéro de client
      doc.fontSize(12)
         .font("OpenSans")
         .text(`N° de client : ${clientNumber}`, { align: 'center' });
      
      doc.fontSize(10)
         .text('(A communiquer pour toute demande)', { align: 'center' });

      doc.moveDown(2);

      // Nom du stagiaire
      doc.fontSize(14)
         .font("OpenSans-Bold")
         .text(`${user.lastName.toUpperCase()} ${user.firstName}`);

      doc.moveDown(1);

      // Message de bienvenue
      doc.fontSize(12)
         .font("OpenSans")
         .text(`Bonjour ${user.lastName.toUpperCase()} ${user.firstName} et merci de votre confiance.`);

      doc.moveDown(0.5);
      doc.text('Nous vous confirmons votre inscription à un stage de sécurité routière.');

      doc.moveDown(1.5);

      // Lieu et horaires du stage
      doc.fontSize(12)
         .font("OpenSans-Bold")
         .text('Lieu et horaires du stage :');

      doc.moveDown(0.5);

      doc.font("OpenSans")
         .text('Stage agréé par le Préfet du Nord, agrément n° R2305900010 :');

      doc.moveDown(0.5);

      // Détails des dates et horaires
      const dateDebut = new Date(stage.DateDebut);
      const dateFin = new Date(stage.DateFin);

      doc.text(`${formatDateFR(dateDebut)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}`);
      doc.text(`${formatDateFR(dateFin)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}, à l'adresse suivante :`);

      doc.moveDown(0.5);

      // Adresse
      doc.font("OpenSans-Bold")
         .text(stage.Titre.toUpperCase());
      doc.font("OpenSans")
         .text(stage.Adresse);
      doc.text(`${stage.CodePostal} ${stage.Ville}`);

      doc.moveDown(1);

      // Obligations
      doc.font("OpenSans-Bold")
         .text('Votre présence et le respect des horaires sont obligatoires.');

      doc.moveDown(1);

      // Documents à apporter
      doc.font("OpenSans-Bold")
         .text('Merci de vous munir le jour du stage :');
      doc.font("OpenSans")
         .text('- De votre permis de conduire et de votre pièce d\'identité.');

      doc.moveDown(1.5);

      // Complément de dossier
      doc.font("OpenSans-Bold")
         .text('Complément de dossier :');

      doc.moveDown(0.5);
      doc.font("OpenSans")
         .text('Pièces indispensables car exigées par la Préfecture pour la validation de votre stage. Pièces à présenter à l\'organisateur le jour du stage.');

      doc.moveDown(1);

      // Section dynamique selon le type de stage
      if (options.stageType === 3) {
        // Cas spécifique pour le stage tribunal (cas 3)
        doc.font("OpenSans-Bold")
           .text('Cas n° 3 :');
        doc.font("OpenSans")
           .text('Document transmis par le tribunal,');
        doc.text('Votre pièce d\'identité,');
        doc.text('Cette convocation (en version papier ou sur votre smartphone).');
      } else {
        // Pour les cas 1, 2 et 4 : à venir
        doc.font("OpenSans-Bold")
           .text(`Cas n° ${options.stageType} :`);
        doc.font("OpenSans")
           .text('Informations à venir - vous serez contacté(e) prochainement pour les détails des pièces à fournir.');
      }

      doc.moveDown(1);

      // Cas différents (description)
      doc.fontSize(10);
      doc.text('Cas 1 : Stage volontaire - Récupération de 4 points (art. L. 223-6 alinéa 2 et R. 223-8 du code de la route).');
      doc.text('Cas 2 : Stage obligatoire pour les conducteurs en période probatoire dans le cadre d\'une perte d\'au moins 3 points.(art. L. 223-6 et R. 223-4 du code de la route).');
      doc.text('Cas 3 : Stage en alternative à la poursuite judiciaire proposé par le Procureur de la République ou en exécution d\'une composition pénale (2° de l\'art. 41-1 et 5° de l\'article 41-2 du code de procédure pénale).');
      doc.text('Cas 4 : Peine complémentaire ou obligation imposée dans le cadre du sursis avec mise à l\'épreuve (art.131-35-1 et R.132-45 du code pénal).');

      doc.moveDown(1.5);

      // Informations importantes
      doc.fontSize(12)
         .font("OpenSans-Bold")
         .text('Informations importantes :');

      doc.moveDown(0.5);
      doc.fontSize(10)
         .font("OpenSans")
         .text('Il est de votre responsabilité de vérifier (Préfecture, lettre 48 ou Telepoints) que votre solde de points sur le fichier national du permis de conduire vous permet de récupérer 4 points et que votre participation à un stage volontaire (cas1) date de plus de 1 an. En cas de litige, EG FORMATIONS ne peut être tenu responsable.');

      doc.moveDown(0.5);
      doc.text('Lorsque le stage réunit moins de six personnes, la Préfecture impose à l\'organisateur, l\'annulation du stage. Le centre agréé EG FORMATIONS est tenu de vous informer de cette annulation par tous les moyens mis à sa disposition. En contactant la société "EG FORMATIONS" au 0783372565, une autre date ou un transfert vers un autre lieu pourra donc vous être proposé sur votre demande.');

      doc.moveDown(0.5);
      doc.font("OpenSans-Bold")
         .text('L\'absence même partielle au stage ou le non respect des horaires ne permet pas la récupération de points.');

      doc.moveDown(0.5);
      doc.font("OpenSans")
         .text('Vous pouvez changer la date de votre réservation ou annuler votre inscription au plus tard sept jours avant la date du stage. Passé ce délai, des frais complémentaires vous seront facturés pour un montant de 50€ TTC. En cas d\'annulation ou de transfert deux jours avant la formation, le coût du stage reste dû. Il ne sera alors procédé à aucun remboursement.');

      // Informations légales en bas de page
      doc.moveDown(2);
      doc.fontSize(8)
         .text('N° SIRET 32803479800020 - Code APE 8553Z - RCS - TVA intra communautaire FR24328034798', { align: 'center' });

      doc.end();
    } catch (err) {
      console.error("❌ Exception pendant l'écriture du PDF :", err);
      reject(err);
    }
  });
}

// Envoie l'e-mail avec PDF joint
export async function sendConfirmationEmail(user: User, stage: Stage, options: ReservationOptions) {
  // Générer le PDF avec les options
  const pdfBuffer = await generateReservationPDF(stage, user, options);
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });

  // Déterminer le type de stage pour l'email
  const stageTypeDescriptions = {
    1: "Stage volontaire - Récupération de 4 points",
    2: "Stage obligatoire (période probatoire)",
    3: "Stage en alternative à la poursuite judiciaire",
    4: "Peine complémentaire ou sursis avec mise à l'épreuve"
  };

  const emailContent = `
Bonjour ${user.firstName} ${user.lastName},

Nous vous confirmons votre inscription au stage de sécurité routière suivant :

📍 Lieu : ${stage.Titre}
📍 Adresse : ${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}
📅 Dates : du ${new Date(stage.DateDebut).toLocaleDateString('fr-FR')} au ${new Date(stage.DateFin).toLocaleDateString('fr-FR')}
⏰ Horaires : ${stage.HeureDebut}-${stage.HeureFin} / ${stage.HeureDebut2}-${stage.HeureFin2}
💰 Prix : ${stage.Prix}€
📋 Type : ${stageTypeDescriptions[options.stageType]}

Votre convocation officielle est jointe à cet e-mail en format PDF.

IMPORTANT : 
- Votre présence et le respect des horaires sont obligatoires
- Munissez-vous de votre permis de conduire et de votre pièce d'identité
- Présentez cette convocation le jour du stage
${options.stageType === 3 ? '- N\'oubliez pas le document transmis par le tribunal' : ''}

Pour toute question, contactez-nous au 0783372565.

Cordialement,
L'équipe EG-FORMATIONS
  `;

  await transporter.sendMail({
    from: `"EG-FORMATIONS" <${process.env.MAIL_USER}>`,
    to: user.email,
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
}