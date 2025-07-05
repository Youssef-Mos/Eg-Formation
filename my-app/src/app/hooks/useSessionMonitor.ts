// hooks/useSessionMonitor.ts
'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UseSessionMonitorOptions {
  enabled?: boolean;
  warningMinutes?: number;
  checkInterval?: number;
}

export function useSessionMonitor({
  enabled = true,
  warningMinutes = 5,
  checkInterval = 60000 // ✅ Augmenté à 1 minute pour éviter spam
}: UseSessionMonitorOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ✅ États pour éviter les actions répétitives
  const warningShown = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingExpiration = useRef(false); // ✅ NOUVEAU : Éviter les boucles
  const lastCheck = useRef<number>(0); // ✅ NOUVEAU : Éviter les vérifications trop fréquentes

  const handleSessionExpired = useCallback(async () => {
    // ✅ Éviter les appels multiples simultanés
    if (isHandlingExpiration.current) {
      console.log("🟡 Déconnexion déjà en cours, ignoré");
      return;
    }

    // ✅ Vérifier qu'on est vraiment connecté avant de déconnecter
    if (status !== "authenticated") {
      console.log("🟡 Utilisateur déjà déconnecté, ignoré");
      return;
    }

    isHandlingExpiration.current = true;
    console.log("🔴 Session expirée - déconnexion automatique");
    
    // ✅ Arrêter immédiatement la surveillance
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      toast.error("Votre session a expiré. Redirection vers la connexion...", {
        duration: 3000
      });
      
      await signOut({ 
        redirect: false,
        callbackUrl: "/login?error=session_expired"
      });
      
      // ✅ Délai avant redirection pour éviter les conflits
      setTimeout(() => {
        router.push("/login?error=session_expired");
      }, 1000);
      
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // ✅ Force refresh seulement en cas d'erreur
      window.location.href = "/login?error=session_expired";
    } finally {
      // ✅ Reset après un délai pour éviter les rappels immédiats
      setTimeout(() => {
        isHandlingExpiration.current = false;
      }, 5000);
    }
  }, [router, status]);

  const handleSessionWarning = useCallback(() => {
    // ✅ Vérifier qu'on est toujours connecté avant d'avertir
    if (status !== "authenticated" || warningShown.current) {
      return;
    }

    console.log("⚠️ Avertissement d'expiration de session");
    warningShown.current = true;

    toast.warning(
      `Votre session expire dans ${warningMinutes} minutes.`,
      {
        duration: 8000,
        action: {
          label: "Prolonger",
          onClick: async () => {
            try {
              const response = await fetch("/api/auth/session", { 
                method: "GET",
                cache: "no-store" 
              });
              
              if (response.ok) {
                toast.success("Session prolongée avec succès");
                warningShown.current = false;
              }
            } catch (error) {
              console.error("Erreur lors du prolongement:", error);
            }
          }
        }
      }
    );
  }, [warningMinutes, status]);

  const checkSessionValidity = useCallback(() => {
    const now = Date.now();
    
    // ✅ Éviter les vérifications trop fréquentes (max toutes les 30 secondes)
    if (now - lastCheck.current < 30000) {
      return;
    }
    lastCheck.current = now;

    // ✅ Ne vérifier que si on est vraiment connecté
    if (status !== "authenticated" || !session?.expires) {
      return;
    }

    // ✅ Éviter les vérifications si déconnexion en cours
    if (isHandlingExpiration.current) {
      return;
    }

    const expiryTime = new Date(session.expires).getTime();
    const timeUntilExpiry = expiryTime - now;

    // ✅ Log moins verbeux
    if (timeUntilExpiry > 0) {
      const minutesLeft = Math.round(timeUntilExpiry / 1000 / 60);
      if (minutesLeft % 10 === 0 || minutesLeft <= 5) { // Log toutes les 10 min ou les 5 dernières
        console.log(`🕐 Session expire dans: ${minutesLeft} minutes`);
      }
    }

    // ✅ Session expirée (avec marge de sécurité de 30 secondes)
    if (timeUntilExpiry <= -30000) {
      handleSessionExpired();
      return;
    }

    // ✅ Avertissement avant expiration
    const warningTime = warningMinutes * 60 * 1000;
    if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
      handleSessionWarning();
    } else if (timeUntilExpiry > warningTime) {
      // Reset warning si on est loin de l'expiration
      warningShown.current = false;
    }
  }, [session, status, handleSessionExpired, handleSessionWarning, warningMinutes]);

  // ✅ Surveillance périodique SIMPLIFIÉE
  useEffect(() => {
    // ✅ Ne démarrer que si vraiment connecté et activé
    if (!enabled || status !== "authenticated" || !session) {
      // ✅ Nettoyer l'intervalle si conditions pas remplies
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // ✅ Éviter les multiples intervalles
    if (intervalRef.current) {
      return;
    }

    console.log("🟢 Démarrage de la surveillance de session");

    // Vérification immédiate
    checkSessionValidity();

    // ✅ Intervalle moins fréquent et plus sûr
    intervalRef.current = setInterval(() => {
      // ✅ Double vérification avant chaque check
      if (status === "authenticated" && session && !isHandlingExpiration.current) {
        checkSessionValidity();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        console.log("🟡 Arrêt de la surveillance de session");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, status, session, checkInterval, checkSessionValidity]);

  // ✅ Surveillance des changements de visibilité SIMPLIFIÉE
  useEffect(() => {
    if (!enabled || status !== "authenticated") {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && status === "authenticated" && !isHandlingExpiration.current) {
        console.log("🔄 Onglet redevenu visible - vérification de session");
        // ✅ Petit délai pour éviter les conflits
        setTimeout(() => {
          checkSessionValidity();
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, status, checkSessionValidity]);

  // ✅ Surveillance du storage SIMPLIFIÉE ET SÉCURISÉE
  useEffect(() => {
    if (!enabled) return;

    const handleStorageChange = (e: StorageEvent) => {
      // ✅ Vérifications plus strictes
      if (e.key !== "nextauth.message" || !e.newValue || isHandlingExpiration.current) {
        return;
      }

      try {
        const message = JSON.parse(e.newValue);
        
        // ✅ Vérifier que c'est vraiment un événement de déconnexion
        if (message.event === "session" && message.session === null && status === "authenticated") {
          console.log("🔴 Déconnexion détectée depuis un autre onglet");
          
          // ✅ Délai pour éviter les conflits avec l'onglet qui a déclenché la déconnexion
          setTimeout(() => {
            if (status === "authenticated") { // Double vérification
              handleSessionExpired();
            }
          }, 500);
        }
      } catch (error) {
        // ✅ Erreur silencieuse, pas besoin de log
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [enabled, handleSessionExpired, status]);

  // ✅ Fonction de nettoyage au démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isHandlingExpiration.current = false;
      warningShown.current = false;
    };
  }, []);

  return {
    isSessionValid: status === "authenticated" && 
                   session?.expires && 
                   new Date(session.expires).getTime() > Date.now() &&
                   !isHandlingExpiration.current,
    session,
    status,
    isExpiring: isHandlingExpiration.current
  };
}