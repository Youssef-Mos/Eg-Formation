// app/api/auto-login/route.ts
// ✅ API pour gérer la connexion automatique après inscription

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Vérifier que les credentials sont fournis
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Identifiants manquants' },
        { status: 400 }
      );
    }

    // Faire une requête de connexion vers NextAuth
    const loginResponse = await fetch(`${request.nextUrl.origin}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
        redirect: 'false',
        json: 'true'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Erreur de connexion automatique:', errorText);
      return NextResponse.json(
        { error: 'Échec de la connexion automatique' },
        { status: 401 }
      );
    }

    // Vérifier que la session est créée
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json({
        success: true,
        message: 'Connexion automatique réussie',
        user: session.user
      });
    } else {
      return NextResponse.json(
        { error: 'Session non créée' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur API auto-login:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}