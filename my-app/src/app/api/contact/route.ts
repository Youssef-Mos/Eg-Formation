// app/api/contact/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.nom || !body.prenom || !body.email || !body.telephone || !body.message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Validation du téléphone (format français simplifié)
    const phoneRegex = /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/;
    if (!phoneRegex.test(body.telephone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Création du contact dans la base de données
    const newContact = await prisma.contact.create({
      data: {
        nom: body.nom.trim(),
        prenom: body.prenom.trim(),
        email: body.email.toLowerCase().trim(),
        telephone: body.telephone.trim(),
        message: body.message.trim(),
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
          <p><strong>Nom :</strong> ${body.nom}</p>
          <p><strong>Prénom :</strong> ${body.prenom}</p>
          <p><strong>Email :</strong> <a href="mailto:${body.email}">${body.email}</a></p>
          <p><strong>Téléphone :</strong> <a href="tel:${body.telephone}">${body.telephone}</a></p>
          <p><strong>Date de réception :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Message :</h3>
          <p style="line-height: 1.6; color: #555;">${body.message.replace(/\n/g, '<br>')}</p>
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
        
        <p>Bonjour ${body.prenom} ${body.nom},</p>
        
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-top: 0;">Votre message :</h3>
          <p style="color: #1e40af; font-style: italic;">"${body.message}"</p>
        </div>
        
        <p>Notre équipe va examiner votre demande et vous répondre dans les plus brefs délais, généralement sous 24 heures ouvrées.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #374151; margin-top: 0;">Vos coordonnées :</h4>
          <p style="margin: 5px 0; color: #6b7280;">Email : ${body.email}</p>
          <p style="margin: 5px 0; color: #6b7280;">Téléphone : ${body.telephone}</p>
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
        to: process.env.MAIL_USER, // L'admin reçoit sur la même adresse
        subject: `[EG-Formation] Nouveau message de ${body.prenom} ${body.nom}`,
        html: adminEmailContent,
        // Ajouter l'email du client en reply-to pour faciliter la réponse
        replyTo: body.email
      });

      // Envoyer l'email de confirmation au client
      await transporter.sendMail({
        from: `"EG-Formation" <${process.env.MAIL_USER}>`,
        to: body.email,
        subject: "Confirmation de réception de votre message - EG-Formation",
        html: clientEmailContent
      });

      console.log(`Emails envoyés avec succès pour le contact ${newContact.id}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi des emails:', emailError);
      // Ne pas faire échouer la requête si seul l'email échoue
      // Le contact est quand même sauvegardé en base
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
      contact: {
        id: newContact.id,
        nom: newContact.nom,
        prenom: newContact.prenom,
        email: newContact.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du contact:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'envoi du message' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}