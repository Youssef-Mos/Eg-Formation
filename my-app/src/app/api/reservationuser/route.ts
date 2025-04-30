// app/api/reservation/by-user/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export const runtime = "edge"; // ou "nodejs", selon ton besoin

import { NextRequest } from "next/server";

export async function GET(req: Request) {
  // Convertir la requête en NextRequest pour compatibilité avec getToken
  const nextReq = req as unknown as NextRequest;

  // On récupère le token JWT directement depuis le cookie
  const token = await getToken({
    req: nextReq,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("JWT Token:", token);

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

    const stages = reservations.map((r) => r.stage);
    return NextResponse.json(stages, { status: 200 });
  } catch (err: any) {
    console.error("Erreur récupération historique:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
