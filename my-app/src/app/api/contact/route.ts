// app/api/contact/route.js (si vous utilisez App Router)
// OU pages/api/contact.js (si vous utilisez Pages Router)

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Pour App Router
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
    
    // Création du contact dans la base de données
    const newContact = await prisma.contact.create({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        telephone: body.telephone,
        message: body.message,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Message envoyé avec succès', 
      contact: newContact 
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