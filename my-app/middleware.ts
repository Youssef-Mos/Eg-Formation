// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes protégées par authentification
const protectedRoutes = [
  "/profil", 
  "/dashboard", 
  "/reservation",
  "/mes-reservations"
];

// Routes réservées aux admins
const adminRoutes = [
  "/admin", 
  "/dashboard/admin",
  "/stage/create",
  "/stage/edit"
];

// Routes API protégées
const protectedApiRoutes = [
  "/api/reservation",
  "/api/user",
  "/api/profil"
];

// Routes API admin
const adminApiRoutes = [
  "/api/admin",
  "/api/Stage/CreateStage",
  "/api/Stage/UpdateStage",
  "/api/Stage/DeleteStage"
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  console.log("🔍 Middleware - Path:", path);
  
  try {
    // Récupérer le token de session
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token"
    });

    console.log("🔐 Session exists:", !!session);
    console.log("👤 User role:", session?.role);

    // === VÉRIFICATION DES ROUTES ADMIN ===
    if (adminRoutes.some(route => path.startsWith(route))) {
      if (!session) {
        console.log("❌ Admin route sans session -> redirect login");
        return NextResponse.redirect(new URL("/login?error=auth_required&type=admin", req.url));
      }
      
      if (session.role !== "admin") {
        console.log("❌ Admin route avec rôle non-admin -> redirect home");
        return NextResponse.redirect(new URL("/?error=access_denied", req.url));
      }
      
      console.log("✅ Admin route authorized");
      return NextResponse.next();
    }

    // === VÉRIFICATION DES API ADMIN ===
    if (adminApiRoutes.some(route => path.startsWith(route))) {
      if (!session) {
        console.log("❌ Admin API sans session");
        return NextResponse.json(
          { error: "Authentification requise", code: "AUTH_REQUIRED" }, 
          { status: 401 }
        );
      }
      
      if (session.role !== "admin") {
        console.log("❌ Admin API avec rôle non-admin");
        return NextResponse.json(
          { error: "Accès administrateur requis", code: "ADMIN_REQUIRED" }, 
          { status: 403 }
        );
      }
      
      console.log("✅ Admin API authorized");
      return NextResponse.next();
    }

    // === VÉRIFICATION DES ROUTES PROTÉGÉES ===
    if (protectedRoutes.some(route => path.startsWith(route))) {
      if (!session) {
        console.log("❌ Protected route sans session -> redirect login");
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(loginUrl);
      }
      
      console.log("✅ Protected route authorized");
      return NextResponse.next();
    }

    // === VÉRIFICATION DES API PROTÉGÉES ===
    if (protectedApiRoutes.some(route => path.startsWith(route))) {
      if (!session) {
        console.log("❌ Protected API sans session");
        return NextResponse.json(
          { error: "Authentification requise", code: "AUTH_REQUIRED" }, 
          { status: 401 }
        );
      }
      
      console.log("✅ Protected API authorized");
      return NextResponse.next();
    }

    // === VÉRIFICATION SESSION EXPIRÉE ===
    if (session && session.exp && Date.now() >= Number(session.exp) * 1000) {
      console.log("⏰ Session expirée");
      
      // Si c'est une API, retourner une erreur
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Session expirée", code: "SESSION_EXPIRED" }, 
          { status: 401 }
        );
      }
      
      // Si c'est une page, rediriger vers login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    // === REDIRECTION DES PAGES LOGIN/REGISTER SI DÉJÀ CONNECTÉ ===
    if ((path === "/login" || path === "/register") && session) {
      console.log("🔄 Utilisateur connecté, redirect vers home");
      return NextResponse.redirect(new URL("/", req.url));
    }

    console.log("✅ Route publique autorisée");
    return NextResponse.next();

  } catch (error) {
    console.error("❌ Erreur middleware:", error);
    
    // En cas d'erreur, rediriger vers la page d'accueil
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Erreur d'authentification", code: "AUTH_ERROR" }, 
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.svg|public).*)",
  ],
};