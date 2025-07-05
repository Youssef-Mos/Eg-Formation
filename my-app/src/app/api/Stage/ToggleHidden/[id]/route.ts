// Fichier : app/api/Stage/ToggleHidden/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ PATCH - Masquer/Démasquer un stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Début de la requête ToggleHidden pour stage:', params.id);

    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ Authentification requise');
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérification des droits admin
    if (session.user?.role !== 'admin') {
      console.log('❌ Droits admin requis pour:', session.user?.email);
      return NextResponse.json(
        { error: 'ADMIN_REQUIRED', message: 'Droits administrateur requis' },
        { status: 403 }
      );
    }

    // Validation de l'ID du stage
    const stageId = parseInt(params.id);
    if (isNaN(stageId)) {
      console.log('❌ ID de stage invalide:', params.id);
      return NextResponse.json(
        { error: 'INVALID_STAGE_ID', message: 'ID de stage invalide' },
        { status: 400 }
      );
    }

    // Récupération du body de la requête
    const body = await request.json();
    const { hidden } = body;

    // Validation du champ hidden
    if (typeof hidden !== 'boolean') {
      console.log('❌ Valeur hidden invalide:', hidden);
      return NextResponse.json(
        { error: 'INVALID_HIDDEN_VALUE', message: 'La valeur hidden doit être un booléen' },
        { status: 400 }
      );
    }

    // Vérifier que le stage existe et récupérer ses infos
    const existingStage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        Titre: true,
        NumeroStage: true,
        hidden: true
      }
    });

    if (!existingStage) {
      console.log('❌ Stage non trouvé:', stageId);
      return NextResponse.json(
        { error: 'STAGE_NOT_FOUND', message: 'Stage non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le changement est nécessaire
    if (existingStage.hidden === hidden) {
      console.log('⚠️ Aucun changement nécessaire, état déjà:', hidden);
      return NextResponse.json({
        success: true,
        message: `Stage déjà ${hidden ? 'masqué' : 'démasqué'}`,
        stage: {
          id: existingStage.id,
          title: existingStage.Titre,
          hidden: existingStage.hidden
        }
      });
    }

    // Mise à jour du statut hidden du stage
    const updatedStage = await prisma.stage.update({
      where: { id: stageId },
      data: { 
        hidden,
        updatedAt: new Date() // Mettre à jour le timestamp
      },
      select: {
        id: true,
        Titre: true,
        NumeroStage: true,
        hidden: true,
        updatedAt: true
      }
    });

    // Log de l'action pour audit
    console.log(`✅ Stage ${stageId} (${updatedStage.Titre}) ${hidden ? 'masqué' : 'démasqué'} par l'admin ${session.user?.email}`);

    // Log dans la base de données pour audit (optionnel)
    // await prisma.auditLog.create({
    //   data: {
    //     action: `STAGE_${hidden ? 'HIDDEN' : 'SHOWN'}`,
    //     userId: session.user.id,
    //     targetId: stageId,
    //     details: `Stage "${updatedStage.Titre}" ${hidden ? 'masqué' : 'démasqué'}`
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: `Stage "${updatedStage.Titre}" ${hidden ? 'masqué' : 'démasqué'} avec succès`,
      stage: {
        id: updatedStage.id,
        title: updatedStage.Titre,
        number: updatedStage.NumeroStage,
        hidden: updatedStage.hidden,
        updatedAt: updatedStage.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du toggle hidden:', error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'STAGE_NOT_FOUND', message: 'Stage non trouvé' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'CONSTRAINT_ERROR', message: 'Erreur de contrainte de base de données' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ GET - Récupérer le statut hidden d'un stage (pour vérification)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ADMIN_REQUIRED', message: 'Droits administrateur requis' },
        { status: 403 }
      );
    }

    const stageId = parseInt(params.id);
    if (isNaN(stageId)) {
      return NextResponse.json(
        { error: 'INVALID_STAGE_ID', message: 'ID de stage invalide' },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        Titre: true,
        NumeroStage: true,
        hidden: true,
        updatedAt: true
      }
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'STAGE_NOT_FOUND', message: 'Stage non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stage: {
        id: stage.id,
        title: stage.Titre,
        number: stage.NumeroStage,
        hidden: stage.hidden,
        updatedAt: stage.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du statut:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}