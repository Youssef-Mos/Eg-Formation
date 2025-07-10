// app/api/admin/stage-complete-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, validateRequestData, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";

// Validateur pour les données de notification
const isValidNotificationData = (data: any): data is {
  stageId: number;
  stageTitle: string;
  stageNumber: string;
  stageDate: string;
  stageLocation: string;
} => {
  return (
    typeof data === "object" &&
    typeof data.stageId === "number" && data.stageId > 0 &&
    typeof data.stageTitle === "string" && data.stageTitle.trim().length > 0 &&
    typeof data.stageNumber === "string" && data.stageNumber.trim().length > 0 &&
    typeof data.stageDate === "string" &&
    typeof data.stageLocation === "string" && data.stageLocation.trim().length > 0
  );
};

export const POST = withAdminAuth(async (request: NextRequest, { session }) => {
  // Validation des données
  const { data, error } = await validateRequestData(request, isValidNotificationData);
  if (error) {
    logApiAccess(request, session, false, "INVALID_REQUEST_DATA");
    return error;
  }

  if (!data) {
    logApiAccess(request, session, false, "INVALID_REQUEST_DATA");
    return NextResponse.json(
      { error: "Données de notification manquantes ou invalides", code: "INVALID_REQUEST_DATA" },
      { status: 400 }
    );
  }
  const { stageId, stageTitle, stageNumber, stageDate, stageLocation } = data;

  try {
    // ✅ VÉRIFIER si les credentials email sont configurés
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    
    if (!mailUser || !mailPass) {
      console.log(`⚠️ Notification stage complet ${stageNumber} - Email non configuré, notification log seulement`);
      logApiAccess(request, session, true, "EMAIL_NOT_CONFIGURED");
      
      return NextResponse.json({
        success: true,
        message: "Stage complet noté (email non configuré)",
        stageId,
        stageNumber,
        emailConfigured: false,
        timestamp: new Date().toISOString()
      });
    }

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    // ✅ TESTER la connexion email avant d'envoyer
    try {
      await transporter.verify();
    } catch (emailError) {
      console.log(`⚠️ Erreur de configuration email pour stage ${stageNumber}:`, emailError);
      logApiAccess(request, session, true, "EMAIL_CONFIG_ERROR");
      
      return NextResponse.json({
        success: true,
        message: "Stage complet noté (erreur config email)",
        stageId,
        stageNumber,
        emailConfigured: false,
        error: "Configuration email invalide",
        timestamp: new Date().toISOString()
      });
    }

    // Format de la date
    const formattedDate = new Date(stageDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Contenu de l'email (votre HTML existant)
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .info-table .label { font-weight: bold; background: #f3f4f6; width: 150px; }
    .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
    .badge { background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 STAGE COMPLET - Notification Administrateur</h1>
      <p>Un stage de formation vient d'atteindre sa capacité maximale</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h3>⚠️ Action requise</h3>
        <p>Le stage suivant est désormais <span class="badge">COMPLET</span> et n'accepte plus de nouvelles réservations.</p>
      </div>
      
      <h3>📋 Détails du stage</h3>
      <table class="info-table">
        <tr>
          <td class="label">Numéro de stage</td>
          <td><strong>${stageNumber}</strong></td>
        </tr>
        <tr>
          <td class="label">Titre</td>
          <td>${stageTitle}</td>
        </tr>
        <tr>
          <td class="label">Date</td>
          <td>${formattedDate}</td>
        </tr>
        <tr>
          <td class="label">Lieu</td>
          <td>${stageLocation}</td>
        </tr>
        <tr>
          <td class="label">Places disponibles</td>
          <td><span style="color: #dc2626; font-weight: bold;">0 / COMPLET</span></td>
        </tr>
      </table>
      
      <h3>📊 Actions recommandées</h3>
      <ul>
        <li>✅ Vérifier la liste des participants inscrits</li>
        <li>📧 Informer les éventuels candidats sur liste d'attente</li>
        <li>📅 Considérer l'ouverture d'un nouveau stage si la demande est forte</li>
        <li>📋 Préparer les documents de formation pour les participants</li>
      </ul>
      
      <div class="alert-box">
        <p><strong>Note :</strong> Ce stage n'apparaîtra plus comme réservable sur la plateforme et affichera le statut "COMPLET" aux visiteurs.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>🏢 <strong>EG-FORMATIONS</strong> | Système de notification automatique</p>
      <p>📧 Notification générée par ${session.user.email} le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Version texte simple
    const textContent = `
🚨 STAGE COMPLET - Notification Administrateur

Un stage de formation vient d'atteindre sa capacité maximale.

📋 Détails du stage :
- Numéro de stage : ${stageNumber}
- Titre : ${stageTitle}
- Date : ${formattedDate}
- Lieu : ${stageLocation}
- Places disponibles : 0 / COMPLET

📊 Actions recommandées :
- Vérifier la liste des participants inscrits
- Informer les éventuels candidats sur liste d'attente
- Considérer l'ouverture d'un nouveau stage si la demande est forte
- Préparer les documents de formation pour les participants

Note : Ce stage n'apparaîtra plus comme réservable sur la plateforme.

EG-FORMATIONS | Système de notification automatique
Notification générée par ${session.user.email} le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
    `;

    // Envoi de l'email
    await transporter.sendMail({
      from: `"EG-FORMATIONS - Système" <${mailUser}>`,
      to: process.env.ADMIN_EMAIL || mailUser,
      subject: `🚨 STAGE COMPLET - ${stageNumber} - ${stageTitle}`,
      text: textContent,
      html: emailContent,
    });

    console.log(`✅ Notification admin envoyée pour le stage complet: ${stageNumber} par ${session.user.email}`);
    logApiAccess(request, session, true);

    return NextResponse.json({
      success: true,
      message: "Notification admin envoyée avec succès",
      stageId,
      stageNumber,
      emailConfigured: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de la notification admin:", error);
    logApiAccess(request, session, false, "EMAIL_SEND_ERROR");
    return NextResponse.json(
      { 
        error: "Erreur lors de l'envoi de la notification",
        code: "EMAIL_SEND_ERROR",
        stageId,
        stageNumber,
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});