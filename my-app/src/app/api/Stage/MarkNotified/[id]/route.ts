// app/api/Stage/MarkNotified/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ CORRIGÉ : params est maintenant une Promise
) {
  try {
    // ✅ Vérification de l'authentification admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès refusé - Droits administrateur requis", code: "ADMIN_REQUIRED" },
        { status: 403 }
      );
    }

    // ✅ CORRIGÉ : Attendre les paramètres avant de les utiliser
    const resolvedParams = await params;
    const stageId = parseInt(resolvedParams.id);
    
    if (isNaN(stageId) || stageId <= 0) {
      return NextResponse.json(
        { error: "ID de stage invalide", code: "INVALID_STAGE_ID" },
        { status: 400 }
      );
    }

    // ✅ Validation du body
    const body = await request.json();
    if (typeof body.completionNotificationSent !== 'boolean') {
      return NextResponse.json(
        { error: "Données invalides", code: "INVALID_DATA" },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le stage existe
    const existingStage = await prisma.stage.findUnique({
      where: { id: stageId }
    });

    if (!existingStage) {
      return NextResponse.json(
        { error: "Stage non trouvé", code: "STAGE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ✅ Mettre à jour le statut de notification
    const updatedStage = await prisma.stage.update({
      where: { id: stageId },
      data: {
        completionNotificationSent: body.completionNotificationSent,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Stage ${stageId} marqué comme notifié par ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Statut de notification mis à jour",
      stage: {
        id: updatedStage.id,
        NumeroStage: updatedStage.NumeroStage,
        completionNotificationSent: updatedStage.completionNotificationSent,
        updatedAt: updatedStage.updatedAt
      }
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour du statut de notification:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la mise à jour",
        code: "SERVER_ERROR",
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}