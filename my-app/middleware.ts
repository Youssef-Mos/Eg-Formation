import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // On protège uniquement les routes sous /admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // On vérifie si le token contient le rôle admin
      if (req.nextauth.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Autorise l'accès pour toutes les autres routes si l'utilisateur est connecté
        return !!token;
      },
    },
  }
);

export const config = { matcher: ["/admin/:path*"] };
