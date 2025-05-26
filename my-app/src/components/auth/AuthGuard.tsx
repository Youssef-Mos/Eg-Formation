// components/auth/AuthGuard.tsx
'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackUrl?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  requireAdmin = false,
  fallbackUrl = "/"
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 AuthGuard - Status:", status);
      console.log("🔍 AuthGuard - Session:", session);
      console.log("🔍 AuthGuard - RequireAuth:", requireAuth);
      console.log("🔍 AuthGuard - RequireAdmin:", requireAdmin);

      // Attendre que le statut soit déterminé
      if (status === "loading") {
        return;
      }

      // Vérifier l'expiration de la session
      if (session?.expires) {
        const expiryTime = new Date(session.expires).getTime();
        const currentTime = Date.now();
        
        if (currentTime >= expiryTime) {
          console.log("⏰ Session expirée, déconnexion");
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
          await signOut({ redirect: false });
          router.push("/login");
          return;
        }
      }

      setIsChecking(false);

      // Vérification de l'authentification
      if (requireAuth && !session) {
        console.log("❌ Authentification requise mais pas de session");
        toast.error("Vous devez être connecté pour accéder à cette page.");
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Vérification du rôle admin
      if (requireAdmin) {
        if (!session) {
          console.log("❌ Admin requis mais pas de session");
          toast.error("Vous devez être connecté en tant qu'administrateur.");
          router.push("/login?error=admin_required");
          return;
        }

        if (session.user?.role !== "admin") {
          console.log("❌ Admin requis mais rôle non-admin:", session.user?.role);
          toast.error("Accès refusé. Droits administrateur requis.");
          router.push(fallbackUrl);
          return;
        }
      }

      console.log("✅ Vérifications de sécurité passées");
    };

    checkAuth();
  }, [session, status, requireAuth, requireAdmin, router, fallbackUrl]);

  // Écran de chargement pendant la vérification
  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Vérification des accès...</h3>
            <p className="text-sm text-gray-500">Authentification en cours</p>
          </div>
        </div>
      </div>
    );
  }

  // Écran d'erreur si pas d'authentification requise
  if (requireAuth && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h2>
            <p className="text-gray-600">
              Vous devez être connecté pour accéder à cette page.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push("/login")}
              className="cursor-pointer"
            >
              Se connecter
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="cursor-pointer"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Écran d'erreur si pas les droits admin
  if (requireAdmin && session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <Shield className="w-16 h-16 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès administrateur requis</h2>
            <p className="text-gray-600">
              Vous n'avez pas les droits nécessaires pour accéder à cette section.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push("/")}
              className="cursor-pointer"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="cursor-pointer"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si tout est OK, afficher le contenu
  return <>{children}</>;
}