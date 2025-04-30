import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  // Utilise Prisma comme adapter pour NextAuth
  adapter: PrismaAdapter(prisma),
  // Configure la stratégie de session
  session: {
    strategy: "jwt",
  },
  // Clé secrète pour signer les JWT et sécuriser les sessions
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        // Recherche l'utilisateur par email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          return null;
        }
        // Vérifie le mot de passe
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }
        // Retourne un objet minimal représentant l'utilisateur avec 'username'
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || undefined,
          role: user.role,
          username: user.name || "Utilisateur", // Ajout de la propriété 'username'
        };
      }
    }),
  ],

  callbacks: {
    // Ajoute le champ role dans le token JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    // Expose le champ role dans la session côté client
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
