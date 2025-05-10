import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

import { NextRequest } from "next/server";

export async function GET(req: Request) {
  // Convertir la requête en NextRequest pour compatibilité avec getToken
  const nextReq = req as unknown as NextRequest;

  // On récupère le token JWT depuis le cookie
  const token = await getToken({
    req: nextReq,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(token.sub);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: {
        stage: {
          select: {
            id: true,
            Titre: true,
            Adresse: true,
            CodePostal: true,
            Ville: true,
            DateDebut: true,
            DateFin: true,
            HeureDebut: true,
            HeureFin: true,
            Prix: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log("Réservations récupérées:", reservations);
    return NextResponse.json(reservations, { status: 200 });
  } catch (err: any) {
    console.error("Erreur récupération historique:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}