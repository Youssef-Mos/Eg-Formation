// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Vérification minimale côté serveur (tu peux adapter selon tes besoins)
    const requiredFields = ['email', 'password', 'username', 'lastName', 'firstName', 'birthDate', 'birthPlace', 'address1', 'postalCode', 'city', 'phone1', 'permitNumber', 'permitIssuedAt'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis.` },
          { status: 400 }
        );
      }
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Création de l'utilisateur
    const user = await prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
        birthDate: new Date(body.birthDate),
        permitDate: new Date(body.permitDate),
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création utilisateur:', error);
    // Vérification d'une erreur d'unicité (ex: email ou username déjà utilisé)
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
  }
}
