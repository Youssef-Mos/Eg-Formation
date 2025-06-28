import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Wrapper spécialisé pour les routes avec paramètres dynamiques
async function withAdminAuthAndParams(
  request: NextRequest,
  params: { id: string },
  handler: (request: NextRequest, context: { session: any; params: { id: string } }) => Promise<NextResponse>
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }
  
  return handler(request, { session: session!, params });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuthAndParams(request, params, async (req, { session, params }) => {
    const { id } = await params;
    const stageId = Number(id);

    // Validation de l'ID
    if (isNaN(stageId)) {
      logApiAccess(req, session, false, "INVALID_STAGE_ID");
      return NextResponse.json(
        { error: 'Identifiant de stage invalide.' },
        { status: 400 }
      );
    }

    try {
      // Récupérer le stage avec ses réservations et profils utilisateurs
      const stageWithReservations = await prisma.stage.findUnique({
        where: { id: stageId },
        include: {
          reservations: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          }
        }
      });

      // Si le stage n'existe pas
      if (!stageWithReservations) {
        logApiAccess(req, session, false, "STAGE_NOT_FOUND");
        return NextResponse.json(
          { error: `Stage avec l'id ${stageId} non trouvé.` },
          { status: 404 }
        );
      }

      // Toujours renvoyer 200, même si aucun enregistrement dans reservations
      logApiAccess(req, session, true);
      return NextResponse.json(stageWithReservations, { status: 200 });
    } catch (error) {
      console.error('Erreur API RecupStageByID:', error);
      logApiAccess(req, session, false, "FETCH_FAILED");
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du stage.' },
        { status: 500 }
      );
    }
  });
}