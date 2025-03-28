// middleware.ts

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profil", "/dashboard", "/admin"];

export async function middleware(req: NextRequest) {
  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token" 
      : "next-auth.session-token"
  });

  console.log("Path:", req.nextUrl.pathname);
  console.log("Session exists:", !!session);

  if (protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      console.log("Redirection vers /login");
      return NextResponse.redirect(new URL("/", req.url));
    }
    console.log("Accès autorisé pour", session.email);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};