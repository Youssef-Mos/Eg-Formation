import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
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
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        
        if (!user) {
          return null;
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || undefined,
          role: user.role,
          username: user.name || "Utilisateur",
        };
      }
    }),
  ],
  callbacks: {
    // Ajoute l'ID et le rôle dans le token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Ajout de l'ID utilisateur
        token.role = (user as any).role;
      }
      return token;
    },
    // Expose l'ID et le rôle dans la session côté client
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string; // Ajout de l'ID utilisateur
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};