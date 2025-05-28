// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

console.log("🔗 Initialisation de Prisma Client pour l'authentification") ;
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("🔐 === DÉBUT AUTHENTIFICATION ===");
        console.log("📧 Identifiant:", credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Credentials manquants");
          return null;
        }

        try {
          // Recherche utilisateur par username OU email
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

          // Créer l'objet utilisateur pour NextAuth
          const authUser = {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`.trim() || user.username,
          };

          console.log("✅ SUCCÈS: Authentification réussie");
          console.log("👤 Utilisateur authentifié:", authUser);
          console.log("🔐 === FIN AUTHENTIFICATION ===");
          
          return authUser;

        } catch (error) {
          console.error("💥 ERREUR CRITIQUE lors de l'authentification:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("🎫 JWT: Ajout des données utilisateur au token");
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        console.log("📋 SESSION: Configuration session utilisateur");
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,

  // Gestion d'erreurs améliorée
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("✅ Événement: Connexion réussie pour", user.email);
    },
    async signOut({ session, token }) {
      console.log("👋 Événement: Déconnexion de", token?.email || "utilisateur inconnu");
    },
  },
};

export default authOptions;