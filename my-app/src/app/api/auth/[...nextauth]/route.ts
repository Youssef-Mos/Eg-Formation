// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET, // Assure-toi d'avoir défini cette variable d'environnement
    session: {
      strategy: "jwt",
    },
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
  
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
          console.log('cacacacauser', user?.password);
          if (user && await bcrypt.compare(credentials.password, user.password)) {
            return { ...user, id: user.id.toString() } as any;
          }
          return null;
        },
      }),
    ],
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user) {
          console.log('JWT Callback - User:', user);
          token.id = user.id;
          token.username = user.username;
          token.email = user.email;
          token.role = user.role;
        }
        return token;
      },
      session: async ({ session, token }) => {
        console.log('Session Callback - Token:', token);
        return {
          ...session,
          user: {
            id: token.id as string,
            username: token.username as string,
            email: token.email as string,
            role: token.role as string,
          },
        };
      },
    },
  };
  

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
