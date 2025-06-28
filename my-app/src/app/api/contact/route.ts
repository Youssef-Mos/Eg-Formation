// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { withApiSecurity, validateRequestData, logApiAccess, validators } from '@/lib/apiSecurity';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Validateur pour les données de contact
const isValidContactData = (data: any): data is {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
} => {
  return (
    typeof data === "object" &&
    typeof data.nom === "string" && data.nom.trim().length > 0 &&
    typeof data.prenom === "string" && data.prenom.trim().length > 0 &&
    validators.isValidEmail(data.email) &&
    typeof data.telephone === "string" && data.telephone.trim().length > 0 &&
    typeof data.message === "string" && data.message.trim().length > 0
  );
};

export async function POST(request: NextRequest) {
  // Route publique mais avec surveillance de sécurité
  const { session, error } = await withApiSecurity(request, { requireAuth: false });
  if (error) return error;

  // Validation des données
  const { data, error: validationError } = await validateRequestData(request, isValidContactData);
  if (validationError) {
    logApiAccess(request, session, false, "INVALID_CONTACT_DATA");
    return validationError;
  }

  if (!data) {
    logApiAccess(request, session, false, "INVALID_CONTACT_DATA");
    return NextResponse.json(
      { 
        error: 'Données de contact manquantes ou invalides',
        code: "INVALID_CONTACT_DATA",
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  const { nom, prenom, email, telephone, message } = data;

  try {
    // Validation supplémentaire du téléphone (format français)
    const phoneRegex = /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/;
    if (!phoneRegex.test(telephone.replace(/\s/g, ''))) {
      logApiAccess(request, session, false, "INVALID_PHONE_FORMAT");
      return NextResponse.json(
        { 
          error: 'Numéro de téléphone invalide',
          code: "INVALID_PHONE_FORMAT",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Création du contact dans la base de données
    const newContact = await prisma.contact.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        telephone: telephone.trim(),
        message: message.trim(),
      },
    });

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    });

    // Email à l'admin
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Nouveau message de contact - EG-Formation
        </h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #3b82f6; margin-top: 0;">Informations du contact</h2>
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Prénom :</strong> ${prenom}</p>
          <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Téléphone :</strong> <a href="tel:${telephone}">${telephone}</a></p>
          <p><strong>Date de réception :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Contact ID :</strong> #${newContact.id}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Message :</h3>
          <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Action requise :</strong> Répondre à ce message dans les 24 heures pour maintenir notre niveau de service client.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Ceci est un message automatique envoyé depuis le site EG-Formation
          </p>
        </div>
      </div>
    `;

    // Email de confirmation au client
    const clientEmailContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Merci pour votre message !</h1>
        
        <p>Bonjour ${prenom} ${nom},</p>
        
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-top: 0;">Votre message :</h3>
          <p style="color: #1e40af; font-style: italic;">"${message}"</p>
        </div>
        
        <p>Notre équipe va examiner votre demande et vous répondre dans les plus brefs délais, généralement sous 24 heures ouvrées.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #374151; margin-top: 0;">Vos coordonnées :</h4>
          <p style="margin: 5px 0; color: #6b7280;">Email : ${email}</p>
          <p style="margin: 5px 0; color: #6b7280;">Téléphone : ${telephone}</p>
          <p style="margin: 5px 0; color: #6b7280;">Référence : #${newContact.id}</p>
        </div>
        
        <p>Si votre demande est urgente, vous pouvez également nous contacter directement :</p>
        <ul>
          <li>Téléphone : <strong>07 83 37 25 65</strong> (Lundi au samedi, 9h-18h)</li>
          <li>Email : <strong>contact@eg-formations.com</strong></li>
        </ul>
        
        <p style="margin-top: 30px;">Cordialement,</p>
        <p><strong>L'équipe EG-Formation</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            61, rue de Lyon - 75012 Paris | Tel: 07 83 37 25 65
          </p>
        </div>
      </div>
    `;

    try {
      // Envoyer l'email à l'admin
      await transporter.sendMail({
        from: `"EG-Formation Contact" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_USER,
        subject: `[EG-Formation] Nouveau message de ${prenom} ${nom} - Ref #${newContact.id}`,
        html: adminEmailContent,
        replyTo: email
      });

      // Envoyer l'email de confirmation au client
      await transporter.sendMail({
        from: `"EG-Formation" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Confirmation de réception de votre message - EG-Formation",
        html: clientEmailContent
      });

      console.log(`✅ Emails envoyés avec succès pour le contact ${newContact.id}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi des emails:', emailError);
      // Ne pas faire échouer la requête si seul l'email échoue
    }

    logApiAccess(request, session, true);
    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
      contact: {
        id: newContact.id,
        nom: newContact.nom,
        prenom: newContact.prenom,
        email: newContact.email,
        reference: `#${newContact.id}`
      },
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de la création du contact:', error);
    logApiAccess(request, session, false, "DATABASE_ERROR");
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de l\'envoi du message',
        code: "DATABASE_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}