import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  // Configure ici tes providers (par exemple, un provider Credentials)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // Ici tu vérifies les informations (via ta base de données par exemple)
        // Si tout est OK, retourne l'objet utilisateur, sinon retourne null
        const user = { id: 1, name: "John Doe", email: credentials?.email };
        return user;
      },
    }),
    // Tu peux ajouter d'autres providers (GitHub, Google, etc.) selon tes besoins
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
