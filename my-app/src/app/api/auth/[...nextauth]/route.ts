// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        // Recherche l'utilisateur par le champ username (et non l'id)
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        // Vérifie le mot de passe (en production, n'oublie pas de hasher !)
        if (user && user.password === credentials.password) {
          // Convertir l'id (number) en string pour satisfaire NextAuth
          return { ...user, id: user.id.toString() } as any;
        }
        return null;
      },
    }),
  ],
  // Autres options (callbacks, pages personnalisées, etc.) si nécessaire
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
