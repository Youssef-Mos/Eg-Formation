// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log("Demande de réinitialisation pour:", email); // Log pour debug

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    console.log("Utilisateur trouvé:", user ? { id: user.id, email: user.email } : "Aucun");

    // Pour des raisons de sécurité, on renvoie toujours une réponse positive
    if (!user) {
      console.log("Email non trouvé, mais on renvoie une réponse positive pour la sécurité");
      return NextResponse.json({ 
        message: "Si cette adresse email existe, un lien de réinitialisation a été envoyé" 
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 3600000); // 1 heure

    console.log("Token généré:", resetToken);
    console.log("Expiration:", resetTokenExp);

    try {
      // Sauvegarder le token dans la base de données
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExp
        }
      });
      console.log("Token sauvegardé en base de données");
    } catch (dbError) {
      console.error("Erreur lors de la sauvegarde du token:", dbError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du token. Vérifiez que les champs resetToken et resetTokenExp existent dans votre modèle User." },
        { status: 500 }
      );
    }

    // Créer le lien de réinitialisation
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log("URL de réinitialisation:", resetUrl);

    // Configurer et envoyer l'email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER!,
          pass: process.env.MAIL_PASS!,
        },
      });

      await transporter.sendMail({
        from: `"EG-Formation" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Réinitialisation de mot de passe</h1>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte EG-Formation.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            
            <p><strong>Important :</strong> Ce lien est valable pendant 1 heure seulement.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
            
            <p style="margin-top: 30px;">Cordialement,</p>
            <p><strong>L'équipe EG-Formation</strong></p>
          </div>
        `,
      });

      console.log("Email envoyé avec succès");
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Email de réinitialisation envoyé avec succès" 
    });
  } catch (error) {
    console.error("Erreur générale:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}