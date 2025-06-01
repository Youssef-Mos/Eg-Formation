// app/api/admin/clients/[id]/permit-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Configuration du transporteur email (à adapter selon votre service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Envoyer un rappel de permis par email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const userId = Number(id);
  
  if (!validators.isValidId(userId)) {
    logApiAccess(request, session, false, "INVALID_USER_ID");
    return NextResponse.json(
      { error: "ID utilisateur invalide", code: "INVALID_USER_ID" },
      { status: 400 }
    );
  }

  try {
    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        role: "client" // S'assurer que c'est un client
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        permitDocumentUploaded: true,
        permitNotificationSent: true
      }
    });

    if (!user) {
      logApiAccess(request, session, false, "USER_NOT_FOUND");
      return NextResponse.json(
        { error: "Client non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur n'a pas déjà téléchargé son permis
    if (user.permitDocumentUploaded) {
      logApiAccess(request, session, false, "PERMIT_ALREADY_UPLOADED");
      return NextResponse.json(
        { error: "Le client a déjà téléchargé son permis", code: "PERMIT_ALREADY_UPLOADED" },
        { status: 400 }
      );
    }

    // Vérifier si un rappel n'a pas été envoyé récemment (moins de 24h)
    if (user.permitNotificationSent) {
      const lastNotification = new Date(user.permitNotificationSent);
      const now = new Date();
      const hoursSinceLastNotification = (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastNotification < 24) {
        logApiAccess(request, session, false, "NOTIFICATION_TOO_RECENT");
        return NextResponse.json(
          { 
            error: "Un rappel a déjà été envoyé dans les dernières 24h", 
            code: "NOTIFICATION_TOO_RECENT",
            lastSent: user.permitNotificationSent
          },
          { status: 429 }
        );
      }
    }

    // Créer une notification en base
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "permit_reminder",
        title: "Rappel : Document de permis requis",
        message: `Bonjour ${user.firstName} ${user.lastName},\n\nNous vous rappelons qu'il est nécessaire de télécharger une copie de votre permis de conduire pour finaliser votre inscription.\n\nVeuillez vous connecter à votre compte et ajouter ce document dans la section "Mon Profil" > "Permis".\n\nCordialement,\nL'équipe EG-Formation`,
        emailSent: true
      }
    });

    // Préparer le contenu HTML de l'email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rappel - Document de permis requis</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background-color: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 20px; 
              text-align: center;
            }
            .content { 
              padding: 20px 0; 
            }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0; 
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
              font-size: 12px; 
              color: #666; 
              text-align: center;
            }
            .warning-box {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 4px;
              padding: 15px;
              margin: 15px 0;
            }
            .important {
              color: #856404;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚗 EG-Formation</h1>
            <h2>Document de permis requis</h2>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            
            <p>Nous espérons que vous allez bien. Nous vous contactons car il manque un document important pour finaliser votre inscription chez EG-Formation.</p>
            
            <div class="warning-box">
              <p class="important">⚠️ Document manquant : Copie de votre permis de conduire</p>
            </div>
            
            <p>Pour compléter votre dossier et pouvoir réserver des stages, veuillez :</p>
            <ol>
              <li><strong>Vous connecter</strong> à votre compte EG-Formation</li>
              <li><strong>Aller</strong> dans la section "Mon Profil"</li>
              <li><strong>Cliquer</strong> sur l'onglet "Permis"</li>
              <li><strong>Télécharger</strong> une copie claire de votre permis de conduire</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/login" class="button">
                🔗 Se connecter à mon compte
              </a>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p><strong>📋 Formats acceptés :</strong></p>
              <ul>
                <li>PDF (recommandé)</li>
                <li>JPEG / JPG</li>
                <li>PNG</li>
                <li>Taille maximale : 5 MB</li>
              </ul>
            </div>
            
            <p><strong>🔍 Conseils pour un document valide :</strong></p>
            <ul>
              <li>Photo claire et nette (pas de flou)</li>
              <li>Document entier visible</li>
              <li>Informations parfaitement lisibles</li>
              <li>Bonne luminosité</li>
            </ul>
            
            <p>Une fois votre document téléchargé, notre équipe le vérifiera dans les plus brefs délais et vous recevrez une confirmation par email.</p>
            
            <p>Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe EG-Formation</strong></p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement suite à une action d'un administrateur.</p>
            <p>Merci de ne pas répondre à cette adresse.</p>
            <p><strong>EG-Formation</strong> - Centre de formation à la conduite</p>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@eg-formation.com",
        to: user.email,
        subject: "🚗 EG-Formation - Document de permis requis",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue, la notification en base est créée
    }

    // Mettre à jour la date du dernier rappel envoyé
    await prisma.user.update({
      where: { id: userId },
      data: {
        permitNotificationSent: new Date()
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json({ 
      message: "Rappel envoyé avec succès",
      sentTo: user.email,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Erreur lors de l'envoi du rappel:", error);
    logApiAccess(request, session, false, "SEND_REMINDER_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de l'envoi du rappel", 
        code: "SEND_REMINDER_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'historique des rappels pour un client (Admin uniquement)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const userId = Number(id);
  
  if (!validators.isValidId(userId)) {
    logApiAccess(request, session, false, "INVALID_USER_ID");
    return NextResponse.json(
      { error: "ID utilisateur invalide", code: "INVALID_USER_ID" },
      { status: 400 }
    );
  }

  try {
    // Récupérer l'historique des notifications de rappel
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        type: "permit_reminder"
      },
      select: {
        id: true,
        title: true,
        message: true,
        emailSent: true,
        createdAt: true,
        read: true,
        readAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer les infos de base du client
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        role: "client"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        permitDocumentUploaded: true,
        permitNotificationSent: true
      }
    });

    if (!user) {
      logApiAccess(request, session, false, "USER_NOT_FOUND");
      return NextResponse.json(
        { error: "Client non trouvé", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        permitDocumentUploaded: user.permitDocumentUploaded,
        lastNotificationSent: user.permitNotificationSent
      },
      notifications,
      totalReminders: notifications.length,
      canSendReminder: !user.permitDocumentUploaded && (
        !user.permitNotificationSent || 
        (new Date().getTime() - new Date(user.permitNotificationSent).getTime()) >= 24 * 60 * 60 * 1000
      )
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    logApiAccess(request, session, false, "FETCH_HISTORY_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération de l'historique", 
        code: "FETCH_HISTORY_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}