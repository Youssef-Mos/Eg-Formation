// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Vérification minimale côté serveur
    const requiredFields = [
      'email',
      'password',
      'username',
      'lastName',
      'firstName',
      'birthDate',
      'birthPlace',
      'address1',
      'postalCode',
      'city',
      'phone1',
      'permitNumber',
      'permitIssuedAt',
      'acceptTerms',
      'acceptRules',
      'confirmPointsCheck'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis.` },
          { status: 400 }
        );
      }
    }

    // ✅ NOUVELLE VALIDATION : Adresse de facturation
    if (!body.useSameAddressForBilling) {
      const billingRequiredFields = ['billingAddress1', 'billingPostalCode', 'billingCity'];
      
      for (const field of billingRequiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `Le champ d'adresse de facturation ${field} est requis quand une adresse différente est utilisée.` },
            { status: 400 }
          );
        }
      }
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Supprimer les champs qui ne sont pas dans le modèle Prisma
    const { confirmPassword, ...userData } = body;

    // ✅ NOUVELLE LOGIQUE : Gestion des champs de facturation
    const billingData = body.useSameAddressForBilling ? {
      useSameAddressForBilling: true,
      billingAddress1: null,
      billingAddress2: null,
      billingAddress3: null,
      billingPostalCode: null,
      billingCity: null,
      billingCountry: null,
    } : {
      useSameAddressForBilling: false,
      billingAddress1: body.billingAddress1,
      billingAddress2: body.billingAddress2 || null,
      billingAddress3: body.billingAddress3 || null,
      billingPostalCode: body.billingPostalCode,
      billingCity: body.billingCity,
      billingCountry: body.billingCountry || 'FR',
    };

    // ✅ NOUVEAUX CHAMPS : Statut du permis
    const permitData = {
      permitDocumentUploaded: false,
      permitDocumentVerified: false,
      permitNotificationSent: null,
      profileCompleted: false, // Le profil ne sera complet qu'avec le document de permis
    };

    // ✅ CRÉATION avec les nouvelles données de facturation et de permis
    const user = await prisma.user.create({
      data: {
        ...userData,
        ...billingData,
        ...permitData,
        password: hashedPassword,
        birthDate: new Date(body.birthDate),
        permitDate: new Date(body.permitDate),
      },
    });

    // ✅ NOUVEAU : Créer une notification de bienvenue avec rappel du permis
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'welcome_permit_reminder',
        title: 'Bienvenue chez EG-Formation !',
        message: `Bonjour ${user.firstName} ${user.lastName},\n\nBienvenue chez EG-Formation ! Votre compte a été créé avec succès.\n\nPour finaliser votre inscription et pouvoir réserver des stages, il ne vous reste plus qu'à télécharger une copie de votre permis de conduire dans la section "Mon Profil".\n\nCordialement,\nL'équipe EG-Formation`,
        emailSent: false
      }
    });

    // Ne pas retourner le mot de passe dans la réponse
    const { password, ...userResponse } = user;

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error: any) {
    console.error('Erreur création utilisateur:', error);

    // Vérification d'une erreur d'unicité
    if (error.code === 'P2002') {
      const duplicatedField = error.meta?.target;
      return NextResponse.json(
        { error: `La valeur pour ${duplicatedField} existe déjà.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}