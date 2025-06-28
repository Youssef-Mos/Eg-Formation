// app/api/user/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const userId = Number(session!.user.id);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = {
      userId: userId
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 notifications
    });

    // Compter les notifications non lues
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false
      }
    });

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      notifications,
      unreadCount
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    logApiAccess(request, session, false, "FETCH_NOTIFICATIONS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des notifications", 
        code: "FETCH_NOTIFICATIONS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Marquer des notifications comme lues
export async function PUT(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const userId = Number(session!.user.id);
    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Marquer toutes les notifications comme lues
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marquer des notifications spécifiques comme lues
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    } else {
      return NextResponse.json(
        { error: "Paramètres invalides", code: "INVALID_PARAMS" },
        { status: 400 }
      );
    }

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      message: "Notifications mises à jour avec succès"
    });
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications:", error);
    logApiAccess(request, session, false, "UPDATE_NOTIFICATIONS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la mise à jour des notifications", 
        code: "UPDATE_NOTIFICATIONS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}