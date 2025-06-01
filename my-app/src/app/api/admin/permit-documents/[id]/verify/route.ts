// app/api/admin/permit-documents/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Configuration du transporteur email avec gestion d'erreur
const createTransporter = () => {
  try {
    // Vérifier si les variables d'environnement SMTP sont définies
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ Configuration SMTP manquante - les emails ne seront pas envoyés');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } catch (error) {
    console.error('❌ Erreur de configuration SMTP:', error);
    return null;
  }
};

// Fonction pour envoyer un email avec gestion d'erreur
const sendEmailNotification = async (transporter: any, emailOptions: any) => {
  if (!transporter) {
    console.log('📧 Email non envoyé - transporteur non configuré');
    return false;
  }

  try {
    await transporter.sendMail(emailOptions);
    console.log('✅ Email envoyé avec succès');
    return true;
  } catch (emailError) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
    return false;
  }
};

// Vérifier/Approuver/Rejeter un document de permis
export async function PUT(
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
  const documentId = Number(id);
  
  if (!validators.isValidId(documentId)) {
    logApiAccess(request, session, false, "INVALID_DOCUMENT_ID");
    return NextResponse.json(
      { error: "ID de document invalide", code: "INVALID_DOCUMENT_ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { status, adminComments } = body;

    // Validation du statut
    if (!['verified', 'rejected'].includes(status)) {
      logApiAccess(request, session, false, "INVALID_STATUS");
      return NextResponse.json(
        { error: "Statut invalide. Utilisez 'verified' ou 'rejected'", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Récupérer les informations du document et de l'utilisateur
    const document = await prisma.permitDocument.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      logApiAccess(request, session, false, "DOCUMENT_NOT_FOUND");
      return NextResponse.json(
        { error: "Document non trouvé", code: "DOCUMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Mettre à jour le document
    const updatedDocument = await prisma.permitDocument.update({
      where: { id: documentId },
      data: {
        status,
        adminComments: adminComments || null,
        verifiedBy: Number(session!.user.id),
        verifiedAt: new Date()
      }
    });

    // Mettre à jour le statut de l'utilisateur
    if (status === 'verified') {
      await prisma.user.update({
        where: { id: document.user.id },
        data: {
          permitDocumentVerified: true,
          profileCompleted: true
        }
      });
    } else {
      await prisma.user.update({
        where: { id: document.user.id },
        data: {
          permitDocumentVerified: false,
          permitDocumentUploaded: false // Permettre un nouveau téléchargement
        }
      });
    }

    // Créer une notification pour l'utilisateur
    const notificationTitle = status === 'verified' 
      ? 'Document de permis approuvé'
      : 'Document de permis rejeté';
      
    const notificationMessage = status === 'verified'
      ? `Bonjour ${document.user.firstName} ${document.user.lastName},\n\nVotre document de permis de conduire a été vérifié et approuvé par notre équipe.\n\nVous pouvez maintenant réserver des stages en toute sérénité !\n\nCordialement,\nL'équipe EG-Formation`
      : `Bonjour ${document.user.firstName} ${document.user.lastName},\n\nMalheureusement, votre document de permis de conduire n'a pas pu être validé.\n\nRaison : ${adminComments || 'Document illisible ou incomplet'}\n\nVeuillez télécharger un nouveau document dans votre profil.\n\nCordialement,\nL'équipe EG-Formation`;

    // ✅ MODIFICATION : Tentative d'envoi d'email, mais ne pas faire échouer si ça ne marche pas
    let emailSent = false;
    const transporter = createTransporter();
    
    if (transporter) {
      const emailSubject = status === 'verified' 
        ? 'EG-Formation - Document de permis approuvé'
        : 'EG-Formation - Document de permis rejeté';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${emailSubject}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: ${status === 'verified' ? '#f0f9f0' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { padding: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
              .success { color: #065f46; }
              .error { color: #991b1b; }
              .rejection-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>EG-Formation</h1>
                <h2 class="${status === 'verified' ? 'success' : 'error'}">${notificationTitle}</h2>
              </div>
              
              <div class="content">
                <p>Bonjour ${document.user.firstName} ${document.user.lastName},</p>
                
                ${status === 'verified' 
                  ? `
                    <p><strong>Excellente nouvelle !</strong> Votre document de permis de conduire a été vérifié et approuvé par notre équipe.</p>
                    <p>Votre profil est maintenant complet et vous pouvez réserver des stages en toute sérénité !</p>
                    <p>
                      <a href="${process.env.NEXTAUTH_URL}/profile" class="button">
                        Voir mon profil
                      </a>
                    </p>
                  `
                  : `
                    <p>Malheureusement, votre document de permis de conduire n'a pas pu être validé par notre équipe.</p>
                    ${adminComments ? `
                      <div class="rejection-box">
                        <strong>Raison du rejet :</strong><br>
                        ${adminComments}
                      </div>
                    ` : ''}
                    <p>Pour finaliser votre inscription, veuillez télécharger un nouveau document de meilleure qualité dans votre profil.</p>
                    <p><strong>Conseils pour un document valide :</strong></p>
                    <ul>
                      <li>Photo claire et nette (pas de flou)</li>
                      <li>Document entier visible</li>
                      <li>Informations lisibles</li>
                      <li>Format PDF ou image haute résolution</li>
                    </ul>
                    <p>
                      <a href="${process.env.NEXTAUTH_URL}/profile" class="button">
                        Télécharger un nouveau document
                      </a>
                    </p>
                  `
                }
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                
                <p>Cordialement,<br>L'équipe EG-Formation</p>
              </div>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre à cette adresse.</p>
                <p>EG-Formation - Centre de formation à la conduite</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailOptions = {
        from: process.env.SMTP_FROM || "noreply@eg-formation.com",
        to: document.user.email,
        subject: emailSubject,
        html: emailHtml,
      };

      emailSent = await sendEmailNotification(transporter, emailOptions);
    }

    // Créer la notification en base (toujours créée, que l'email soit envoyé ou pas)
    await prisma.notification.create({
      data: {
        userId: document.user.id,
        type: status === 'verified' ? 'permit_verified' : 'permit_rejected',
        title: notificationTitle,
        message: notificationMessage,
        emailSent: emailSent
      }
    });

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      success: true,
      message: `Document ${status === 'verified' ? 'approuvé' : 'rejeté'} avec succès`,
      document: updatedDocument,
      emailSent: emailSent,
      emailStatus: emailSent ? 'Email envoyé' : 'Email non envoyé (configuration SMTP manquante)'
    });
    
  } catch (error) {
    console.error("Erreur lors de la vérification du document:", error);
    logApiAccess(request, session, false, "VERIFY_DOCUMENT_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la vérification", 
        code: "VERIFY_DOCUMENT_FAILED",
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer tous les documents en attente de vérification (Admin)
export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const documents = await prisma.permitDocument.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone1: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Plus anciens en premier
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    logApiAccess(request, session, false, "FETCH_PENDING_DOCUMENTS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération", 
        code: "FETCH_PENDING_DOCUMENTS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}