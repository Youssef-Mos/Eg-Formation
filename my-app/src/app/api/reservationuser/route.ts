// app/api/reservation/historique/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export const GET = withAuth(async (request: NextRequest, { session }) => {
  const userId = Number(session.user.id);

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
    
    logApiAccess(request, session, true);
    return NextResponse.json(reservations, { status: 200 });
  } catch (err: any) {
    console.error("Erreur récupération historique:", err);
    logApiAccess(request, session, false, "FETCH_FAILED");
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique", code: "FETCH_FAILED" },
      { status: 500 }
    );
  }
});