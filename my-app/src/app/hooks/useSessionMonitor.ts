// hooks/useSessionMonitor.ts
'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UseSessionMonitorOptions {
  enabled?: boolean;
  warningMinutes?: number; // Minutes avant expiration pour avertir
  checkInterval?: number; // Intervalle de vérification en ms
}

export function useSessionMonitor({
  enabled = true,
  warningMinutes = 5,
  checkInterval = 30000 // 30 secondes
}: UseSessionMonitorOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const warningShown = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSessionExpired = useCallback(async () => {
    console.log("🔴 Session expirée - déconnexion automatique");
    toast.error("Votre session a expiré. Vous avez été déconnecté automatiquement.");
    
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/login?error=session_expired"
      });
      router.push("/login?error=session_expired");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Force refresh en cas d'erreur
      window.location.href = "/login?error=session_expired";
    }
  }, [router]);

  const handleSessionWarning = useCallback(() => {
    if (!warningShown.current) {
      console.log("⚠️ Avertissement d'expiration de session");
      toast.warning(
        `Votre session expire dans ${warningMinutes} minutes. Activité recommandée pour maintenir la connexion.`,
        {
          duration: 10000,
          action: {
            label: "Rester connecté",
            onClick: () => {
              // Faire une requête pour rafraîchir la session
              fetch("/api/auth/session", { 
                method: "GET",
                cache: "no-store" 
              }).then(() => {
                toast.success("Session prolongée avec succès");
                warningShown.current = false;
              });
            }
          }
        }
      );
      warningShown.current = true;
    }
  }, [warningMinutes]);

  const checkSessionValidity = useCallback(() => {
    if (!session?.expires || status !== "authenticated") {
      return;
    }

    const expiryTime = new Date(session.expires).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    console.log(`🕐 Session expire dans: ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);

    // Session expirée
    if (timeUntilExpiry <= 0) {
      handleSessionExpired();
      return;
    }

    // Avertissement avant expiration
    const warningTime = warningMinutes * 60 * 1000;
    if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
      handleSessionWarning();
    }

    // Reset warning si on est loin de l'expiration
    if (timeUntilExpiry > warningTime) {
      warningShown.current = false;
    }
  }, [session, status, handleSessionExpired, handleSessionWarning, warningMinutes]);

  // Fonction pour vérifier la validité côté serveur
  const verifyServerSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify-session", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        console.log("🔴 Session invalidée côté serveur");
        handleSessionExpired();
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Erreur lors de la vérification de session:", error);
      return true; // Ne pas déconnecter en cas d'erreur réseau
    }
  }, [handleSessionExpired]);

  // Surveillance périodique
  useEffect(() => {
    if (!enabled || status !== "authenticated") {
      return;
    }

    console.log("🟢 Démarrage de la surveillance de session");

    // Vérification immédiate
    checkSessionValidity();

    // Vérification périodique
    intervalRef.current = setInterval(() => {
      checkSessionValidity();
      
      // Vérification côté serveur moins fréquente (toutes les 2 minutes)
      if (Math.random() < 0.25) { // 25% de chance = environ toutes les 2 minutes
        verifyServerSession();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        console.log("🟡 Arrêt de la surveillance de session");
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, status, checkInterval, checkSessionValidity, verifyServerSession]);

  // Surveillance des changements de visibilité (onglet)
  useEffect(() => {
    if (!enabled || status !== "authenticated") {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Onglet redevenu visible - vérification de session");
        checkSessionValidity();
        verifyServerSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, status, checkSessionValidity, verifyServerSession]);

  // Surveillance du storage (déconnexion depuis un autre onglet)
  useEffect(() => {
    if (!enabled) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nextauth.message") {
        try {
          const message = JSON.parse(e.newValue || "{}");
          if (message.event === "session" && !message.session) {
            console.log("🔴 Déconnexion détectée depuis un autre onglet");
            handleSessionExpired();
          }
        } catch (error) {
          console.error("Erreur lors du parsing du message de session:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [enabled, handleSessionExpired]);

  return {
    isSessionValid: status === "authenticated" && session?.expires && new Date(session.expires).getTime() > Date.now(),
    session,
    status,
    manualRefresh: verifyServerSession
  };
}