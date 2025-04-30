// app/api/user/delete/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

import { NextRequest } from "next/server";

export async function DELETE(req: NextRequest) {
  // 1) Récupère le JWT depuis le cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("🔐 token in DELETE /api/user/delete:", token);

  // 2) Vérifie que token.sub (l’ID) est bien présent
  if (!token?.sub) {
    return NextResponse.json(
      { message: "Non autorisé : token manquant ou invalide" },
      { status: 401 }
    );
  }

  // 3) Transforme en nombre et supprime
  const userId = parseInt(token.sub as string, 10);
  await prisma.user.delete({ where: { id: userId } });

  // 4) Réponse OK
  return NextResponse.json(
    { message: "Compte supprimé avec succès" },
    { status: 200 }
  );
}
