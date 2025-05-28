// app/api/stages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { requireAuth: false });
  
  if (error) {
    return error;
  }

  try {
    const stages = await prisma.stage.findMany({
      orderBy: { DateDebut: 'asc' }
    });
    
    logApiAccess(request, session, true);
    return NextResponse.json(stages, { status: 200 });
  } catch (error) {
    console.error("Erreur API:", error);
    logApiAccess(request, session, false, "FETCH_FAILED");
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stages", code: "FETCH_FAILED" },
      { status: 500 }
    );
  }
}