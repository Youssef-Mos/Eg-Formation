// app/api/auth/verify-reset-token/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log("Token reçu:", token); // Log pour debug

    if (!token) {
      console.log("Token manquant");
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Vérifier le token avec plus de logs
    console.log("Recherche du token dans la base de données...");
    
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExp: true,
      }
    });

    console.log("Utilisateur trouvé:", user ? { id: user.id, email: user.email, hasToken: !!user.resetToken, tokenExp: user.resetTokenExp } : "Aucun");

    if (!user) {
      console.log("Aucun utilisateur trouvé avec ce token");
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    const now = new Date();
    console.log("Date actuelle:", now);
    console.log("Date d'expiration du token:", user.resetTokenExp);

    if (!user.resetTokenExp || user.resetTokenExp < now) {
      console.log("Token expiré");
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 400 }
      );
    }

    console.log("Token valide");
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}