// lib/apiSecurity.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  expires: string;
}

export interface SecurityOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
  checkExpiration?: boolean;
}

/**
 * Middleware de sécurité pour les routes API
 */
export async function withApiSecurity(
  request: NextRequest,
  options: SecurityOptions = {}
): Promise<{ session: AuthSession | null; error: NextResponse | null }> {
  const {
    requireAuth = true,
    requireAdmin = false,
    allowedRoles = [],
    checkExpiration = true
  } = options;

  try {
    // Récupérer la session
    const session = await getServerSession(authOptions);

    // Vérifier si une session est requise
    if (requireAuth && !session) {
      return {
        session: null,
        error: NextResponse.json(
          { 
            error: "Authentification requise", 
            code: "AUTH_REQUIRED",
            timestamp: new Date().toISOString()
          }, 
          { status: 401 }
        )
      };
    }

    // Si pas de session requise et pas de session, retourner OK
    if (!requireAuth && !session) {
      return { session: null, error: null };
    }

    // Vérifier l'expiration
    if (session && checkExpiration && session.expires) {
      const expiryTime = new Date(session.expires).getTime();
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        return {
          session: null,
          error: NextResponse.json(
            { 
              error: "Session expirée", 
              code: "SESSION_EXPIRED",
              timestamp: new Date().toISOString()
            }, 
            { status: 401 }
          )
        };
      }
    }

    // Vérifier les droits admin
    if (requireAdmin && session?.user?.role !== "admin") {
      return {
        session: session as AuthSession,
        error: NextResponse.json(
          { 
            error: "Droits administrateur requis", 
            code: "ADMIN_REQUIRED",
            timestamp: new Date().toISOString()
          }, 
          { status: 403 }
        )
      };
    }

    // Vérifier les rôles autorisés
    if (allowedRoles.length > 0 && session?.user?.role && !allowedRoles.includes(session.user.role)) {
      return {
        session: session as AuthSession,
        error: NextResponse.json(
          { 
            error: "Rôle non autorisé", 
            code: "ROLE_NOT_ALLOWED",
            allowedRoles,
            userRole: session.user.role,
            timestamp: new Date().toISOString()
          }, 
          { status: 403 }
        )
      };
    }

    // Tout est OK
    return { 
      session: session as AuthSession, 
      error: null 
    };

  } catch (error) {
    console.error("Erreur dans withApiSecurity:", error);
    return {
      session: null,
      error: NextResponse.json(
        { 
          error: "Erreur interne du serveur", 
          code: "INTERNAL_ERROR",
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      )
    };
  }
}

/**
 * Wrapper pour sécuriser les handlers API
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { session: AuthSession }) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    const { session, error } = await withApiSecurity(request, options);
    
    if (error) {
      return error;
    }
    
    if (!session && options.requireAuth !== false) {
      return NextResponse.json(
        { error: "Session invalide", code: "INVALID_SESSION" }, 
        { status: 401 }
      );
    }
    
    return handler(request, { session: session! });
  };
}

/**
 * Wrapper spécifique pour les routes admin
 */
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: { session: AuthSession }) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true, requireAdmin: true });
}

/**
 * Validation des données de requête
 */
export async function validateRequestData<T>(
  request: NextRequest,
  validator: (data: any) => data is T
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    
    if (!validator(body)) {
      return {
        data: null,
        error: NextResponse.json(
          { 
            error: "Données de requête invalides", 
            code: "INVALID_REQUEST_DATA",
            timestamp: new Date().toISOString()
          }, 
          { status: 400 }
        )
      };
    }
    
    return { data: body, error: null };
    
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        { 
          error: "Corps de requête JSON invalide", 
          code: "INVALID_JSON",
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      )
    };
  }
}

/**
 * Utilitaire pour logger les accès API
 */
export function logApiAccess(
  request: NextRequest, 
  session: AuthSession | null, 
  success: boolean,
  errorCode?: string
) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    userId: session?.user?.id,
    userRole: session?.user?.role,
    success,
    errorCode
  };
  
  if (success) {
    console.log("✅ API Access:", JSON.stringify(logData));
  } else {
    console.warn("❌ API Access Denied:", JSON.stringify(logData));
  }
}

/**
 * Types de validateurs communs
 */
export const validators = {
  // Validateur pour les IDs numériques
  isValidId: (value: any): value is number => {
    return typeof value === "number" && value > 0 && Number.isInteger(value);
  },
  
  // Validateur pour les emails
  isValidEmail: (value: any): value is string => {
    return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  
  // Validateur pour les mots de passe
  isValidPassword: (value: any): value is string => {
    return typeof value === "string" && value.length >= 6;
  },
  
  // Validateur pour les données de stage
  isValidStageData: (data: any): data is {
    Titre: string;
    Adresse: string;
    CodePostal: string;
    Ville: string;
    PlaceDisponibles: number;
    DateDebut: string;
    DateFin: string;
    Prix: number;
  } => {
    return (
      typeof data === "object" &&
      typeof data.Titre === "string" && data.Titre.trim().length > 0 &&
      typeof data.Adresse === "string" && data.Adresse.trim().length > 0 &&
      typeof data.CodePostal === "string" && /^\d{5}$/.test(data.CodePostal) &&
      typeof data.Ville === "string" && data.Ville.trim().length > 0 &&
      typeof data.PlaceDisponibles === "number" && data.PlaceDisponibles >= 0 &&
      typeof data.DateDebut === "string" &&
      typeof data.DateFin === "string" &&
      typeof data.Prix === "number" && data.Prix > 0
    );
  }
};