// app/api/auth/verify-session/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "No session found",
          code: "NO_SESSION" 
        }, 
        { status: 401 }
      );
    }

    // Vérifier l'expiration
    if (session.expires) {
      const expiryTime = new Date(session.expires).getTime();
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "Session expired",
            code: "SESSION_EXPIRED" 
          }, 
          { status: 401 }
        );
      }
    }

     //Optionnel : Vérifier en base de données si l'utilisateur existe encore
     const { PrismaClient } = await import("@prisma/client");
     const prisma = new PrismaClient();
     const user = await prisma.user.findUnique({
       where: { id: parseInt(session.user.id) }
     });
     if (!user) {
       return NextResponse.json({ valid: false, error: "User not found" }, { status: 401 });
     }

    return NextResponse.json({
      valid: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        expires: session.expires
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de session:", error);
    return NextResponse.json(
      { 
        valid: false, 
        error: "Internal server error",
        code: "SERVER_ERROR" 
      }, 
      { status: 500 }
    );
  }
}