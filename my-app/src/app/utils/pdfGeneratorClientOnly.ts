// app/utils/pdfGeneratorClientOnly.ts
// Version CLIENT-ONLY pour tester le PDF sans nodemailer

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

// Fonction pour charger une image et la convertir en base64 (version client)
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    console.log(`🖼️ Chargement de l'image: ${imagePath}`);
    
    const response = await fetch(imagePath);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convertir en base64
    let binary = '';
    uint8Array.forEach(byte => binary += String.fromCharCode(byte));
    const base64 = btoa(binary);
    
    // Déterminer le type MIME
    const extension = imagePath.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' : 
                     extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                     'image/png';
    
    console.log(`✅ Image chargée: ${base64.length} caractères base64`);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement du logo:', error);
    return '';
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

// Génère le PDF de convocation avec jsPDF et logo (VERSION CLIENT)
export async function generateTestPDF(stage: Stage, user: User, options: ReservationOptions): Promise<Uint8Array> {
  // Import dynamique de jsPDF (compatible client)
  const { jsPDF } = await import('jspdf');
  
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🧪 Démarrage génération PDF de test...');
      
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

      // ✨ AJOUT DU LOGO EN HAUT - TOUTE LA LARGEUR
      try {
        console.log('🖼️ Chargement du logo...');
        const logoBase64 = await loadImageAsBase64('/image/logo/Logo%20EG.jpg'); // ✅ Nouvelle image avec espace encodé
        
        if (logoBase64) {
          // Fond gris derrière le logo (toute la largeur)
          const headerHeight = 35; // Hauteur du header
          doc.setFillColor(240, 240, 240); // Gris clair
          doc.rect(0, currentY, pageWidth, headerHeight, 'F'); // Rectangle gris pleine largeur
          
          // Dimensions du logo - TOUTE LA LARGEUR
          const logoWidth = pageWidth - 20; // Presque toute la largeur (marge de 10 de chaque côté)
          const logoHeight = 25; // Plus haut qu'avant
          const logoX = 10; // Petite marge à gauche
          const logoY = currentY + 5; // Un peu d'espace depuis le haut du rectangle
          
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
          currentY += headerHeight + 5; // Espace après le header
          console.log('✅ Logo ajouté avec succès (toute largeur + fond gris)');
        } else {
          console.log('⚠️ Logo non chargé, continuation sans logo');
          currentY += 5;
        }
      } catch (logoError) {
        console.warn('⚠️ Erreur logo, continuation sans logo:', logoError);
        currentY += 5;
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

      // Détails des dates et horaires
      const dateDebut = new Date(stage.DateDebut);
      const dateFin = new Date(stage.DateFin);

      doc.text(`${formatDateFR(dateDebut)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}`, margin, currentY);
      currentY += 6;
      doc.text(`${formatDateFR(dateFin)} - ${stage.HeureDebut}-${stage.HeureFin}/${stage.HeureDebut2}-${stage.HeureFin2}, à l'adresse suivante :`, margin, currentY);
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

      // Section dynamique selon le type de stage - AVEC ENCADRÉ
      checkPageBreak(35);
      const boxX = margin;
      const boxY = currentY;
      const boxWidth = pageWidth - 2 * margin;
      let boxHeight = 25;

      if (options.stageType === 2 || options.stageType === 3 || options.stageType === 4) {
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

      // Informations légales en bas de page
      checkPageBreak(20);
      
      const legalY = Math.max(currentY + 30, pageHeight - 25);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('N° SIRET 32803479800020 - Code APE 8553Z - RCS - TVA intra communautaire FR24328034798', pageWidth / 2, legalY, { align: 'center' });

      // Convertir en Uint8Array pour compatibilité client
      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
      
      console.log(`✅ PDF de test généré avec succès: ${pdfUint8Array.length} bytes`);
      resolve(pdfUint8Array);
      
    } catch (err) {
      console.error("❌ Exception pendant la génération du PDF :", err);
      reject(err);
    }
  });
}

// Données de test par défaut
export const getTestData = () => {
  const testStage: Stage = {
    id: 999,
    Titre: "Centre de Formation EG-FORMATIONS TEST",
    Adresse: "123 Avenue des Tests",
    CodePostal: "75001",
    Ville: "Paris",
    DateDebut: new Date('2025-08-15'),
    DateFin: new Date('2025-08-16'),
    HeureDebut: "08:30",
    HeureFin: "12:00",
    HeureDebut2: "13:30",
    HeureFin2: "17:00",
    Prix: 259,
    NumeroStage: "EG2025TEST001",
    agrement: {
      id: 1,
      departement: "75",
      numeroAgrement: "2025-TEST-001-AGR",
      nomDepartement: "Paris"
    }
  };

  const testUser: User = {
    id: 999,
    firstName: "Jean",
    lastName: "EXEMPLE",
    email: "test@exemple.com"
  };

  const testOptions: ReservationOptions = {
    stageType: 1 // Stage volontaire
  };

  return { testStage, testUser, testOptions };
};