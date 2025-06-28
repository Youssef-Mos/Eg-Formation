// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"; // Changé de bcryptjs à bcrypt pour cohérence

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours (cohérent avec lib/auth.ts)
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
        console.log("🔐 === DÉBUT AUTHENTIFICATION (route.ts) ===");
        console.log("📧 Identifiant:", credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Credentials manquants");
          return null;
        }

        try {
          // MÊME LOGIQUE que lib/auth.ts : recherche par username OU email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username.trim() },
                { email: credentials.username.trim() }
              ]
            },
            select: {
              id: true,
              username: true,
              email: true,
              password: true,
              role: true,
              firstName: true,
              lastName: true,
            }
          });

          console.log("👤 Utilisateur trouvé:", user ? `${user.username} (${user.email}) - Role: ${user.role}` : "AUCUN");

          if (!user) {
            console.log("❌ ÉCHEC: Utilisateur non trouvé");
            return null;
          }

          // Debug du hash de mot de passe
          console.log("🔒 Hash en DB (30 premiers chars):", user.password.substring(0, 30));
          console.log("🔑 Mot de passe fourni (longueur):", credentials.password.length);

          // Vérification mot de passe avec gestion d'erreur
          let isPasswordValid = false;
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            console.log("✅ Vérification mot de passe:", isPasswordValid ? "VALIDE" : "INVALIDE");
          } catch (bcryptError) {
            console.error("💥 Erreur bcrypt:", bcryptError);
            console.log("🔧 Le hash semble corrompu ou utilise une méthode incompatible");
            return null;
          }

          if (!isPasswordValid) {
            console.log("❌ ÉCHEC: Mot de passe incorrect");
            return null;
          }

          // Créer l'objet utilisateur pour NextAuth (cohérent avec lib/auth.ts)
          const authUser = {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`.trim() || user.username,
          };

          console.log("✅ SUCCÈS: Authentification réussie (route.ts)");
          console.log("👤 Utilisateur authentifié:", authUser);
          console.log("🔐 === FIN AUTHENTIFICATION (route.ts) ===");
          
          return authUser;

        } catch (error) {
          console.error("💥 ERREUR CRITIQUE lors de l'authentification:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        console.log('🎫 JWT Callback - User:', user);
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      console.log('📋 Session Callback - Token:', token);
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
  pages: {
    signIn: '/login',
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  debug: process.env.NODE_ENV === "development",
  // Gestion d'erreurs améliorée (comme dans lib/auth.ts)
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("✅ Événement: Connexion réussie pour", user.email);
    },
    async signOut({ session, token }) {
      console.log("👋 Événement: Déconnexion de", token?.email || "utilisateur inconnu");
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };