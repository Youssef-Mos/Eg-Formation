import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Création de l'utilisateur
    const user = await prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
        birthDate: new Date(body.birthDate),
        permitDate: new Date(body.permitDate),
      }
    });

    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}