// app/api/admin/permit-documents/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Récupérer tous les documents en attente de vérification (Admin)
export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const documents = await prisma.permitDocument.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone1: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Plus anciens en premier
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json(documents);
    
  } catch (error) {
    console.error("Erreur lors de la récupération des documents en attente:", error);
    logApiAccess(request, session, false, "FETCH_PENDING_DOCUMENTS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des documents en attente", 
        code: "FETCH_PENDING_DOCUMENTS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}