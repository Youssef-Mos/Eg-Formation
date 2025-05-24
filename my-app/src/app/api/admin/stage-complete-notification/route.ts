// app/api/admin/stage-complete-notification/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { stageId, stageTitle, stageNumber, stageDate, stageLocation } = await request.json();

    if (!stageId || !stageTitle || !stageNumber) {
      return NextResponse.json(
        { error: "Données manquantes pour la notification" },
        { status: 400 }
      );
    }

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    });

    // Format de la date
    const formattedDate = new Date(stageDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Contenu de l'email
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
      <p>📧 Cette notification a été générée automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
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
Cette notification a été générée automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
    `;

    // Envoi de l'email
    await transporter.sendMail({
      from: `"EG-FORMATIONS - Système" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.MAIL_USER, // Email de l'admin
      subject: `🚨 STAGE COMPLET - ${stageNumber} - ${stageTitle}`,
      text: textContent,
      html: emailContent,
    });

    console.log(`✅ Notification admin envoyée pour le stage complet: ${stageNumber}`);

    return NextResponse.json({
      success: true,
      message: "Notification admin envoyée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}