// components/providers/SecureSessionProvider.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { useSessionMonitor } from "@/app/hooks/useSessionMonitor";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface SecureSessionProviderProps {
  children: React.ReactNode;
  session?: any;
}

// Composant de surveillance interne
function SessionMonitorWrapper({ children }: { children: React.ReactNode }) {
  const { isSessionValid, status } = useSessionMonitor({
    enabled: true,
    warningMinutes: 5,
    checkInterval: 30000 // 30 secondes
  });

  const isInitializedRef = useRef(false);
  const legitimateOperationsRef = useRef(new Set<string>());

  // Surveillance des tentatives de manipulation du localStorage
  useEffect(() => {
    // Marquer comme initialisé après un délai pour permettre à NextAuth de s'initialiser
    const initTimer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    const handleStorageAttack = (operation: string, key: string) => {
      console.warn(`🚨 Tentative de manipulation suspecte détectée: ${operation} sur ${key}`);
      toast.error("Activité suspecte détectée. Veuillez vous reconnecter.");
    };

    // Fonction pour vérifier si une opération est suspecte
    const isSuspiciousOperation = (key: string, operation: string): boolean => {
      // Pendant l'initialisation, permettre toutes les opérations NextAuth
      if (!isInitializedRef.current) {
        return false;
      }

      // Permettre les opérations standard de NextAuth
      const allowedNextAuthKeys = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        'next-auth.pkce.code_verifier'
      ];

      // Si c'est une clé NextAuth autorisée, ce n'est pas suspect
      if (allowedNextAuthKeys.some(allowedKey => key.includes(allowedKey))) {
        return false;
      }

      // Vérifier si c'est une tentative de manipulation de clés sensibles
      const sensitivePatterns = [
        /nextauth.*session/i,
        /nextauth.*token/i,
        /auth.*secret/i,
        /session.*id/i
      ];

      return sensitivePatterns.some(pattern => pattern.test(key));
    };

    // Surveillance des modifications non autorisées
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    localStorage.setItem = function(key: string, value: string) {
      if (isSuspiciousOperation(key, 'setItem')) {
        handleStorageAttack('setItem', key);
        return;
      }
      return originalSetItem.apply(this, [key, value]);
    };

    localStorage.removeItem = function(key: string) {
      if (isSuspiciousOperation(key, 'removeItem')) {
        handleStorageAttack('removeItem', key);
        return;
      }
      return originalRemoveItem.apply(this, [key]);
    };

    localStorage.clear = function() {
      // Permettre clear() seulement si initié par NextAuth ou pendant la déconnexion
      if (isInitializedRef.current) {
        const stack = new Error().stack;
        if (!stack?.includes('next-auth') && !stack?.includes('signOut')) {
          handleStorageAttack('clear', 'all');
          return;
        }
      }
      return originalClear.apply(this);
    };

    // Surveillance des tentatives de modification des cookies
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', {
        get: originalCookieDescriptor.get,
        set: function(value: string) {
          // Permettre les cookies NextAuth légitimes
          if (value.includes("next-auth") || value.includes("session")) {
            // Vérifier si c'est une manipulation suspecte
            const suspiciousPatterns = [
              /next-auth\.session-token=.*;.*expires=/i,
              /session.*=.*[<>"\\/]/i // Caractères suspects dans les valeurs
            ];
            
            if (suspiciousPatterns.some(pattern => pattern.test(value))) {
              console.warn("🚨 Tentative de manipulation suspecte des cookies de session");
              toast.error("Manipulation des cookies détectée.");
              return;
            }
          }
          return originalCookieDescriptor.set?.call(this, value);
        },
        configurable: true
      });
    }

    return () => {
      clearTimeout(initTimer);
      // Restaurer les méthodes originales
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
      
      if (originalCookieDescriptor) {
        Object.defineProperty(document, 'cookie', originalCookieDescriptor);
      }
    };
  }, []);

  // Surveillance de l'intégrité de la session (version améliorée)
  useEffect(() => {
    const checkSessionIntegrity = () => {
      // Attendre que NextAuth soit initialisé
      if (!isInitializedRef.current) return;

      try {
        // Vérifier si les tokens de session sont cohérents
        const sessionToken = document.cookie
          .split(';')
          .find(row => row.trim().startsWith('next-auth.session-token'));
        
        const csrfToken = document.cookie
          .split(';')
          .find(row => row.trim().startsWith('next-auth.csrf-token'));

        // Vérification plus nuancée de l'intégrité
        if (sessionToken && !csrfToken) {
          console.warn("🚨 Token CSRF manquant");
          // Ne pas forcer la déconnexion immédiatement, donner une chance à NextAuth de se synchroniser
          setTimeout(() => {
            const recheckCsrf = document.cookie
              .split(';')
              .find(row => row.trim().startsWith('next-auth.csrf-token'));
            
            if (!recheckCsrf) {
              toast.error("Erreur de sécurité détectée. Reconnexion requise.");
              window.location.href = "/api/auth/signout";
            }
          }, 5000);
        }

        // Vérifier la validité du format des tokens
        if (sessionToken) {
          const tokenValue = sessionToken.split('=')[1];
          if (tokenValue && (tokenValue.length < 10 || tokenValue.includes('<script'))) {
            console.warn("🚨 Format de token suspect détecté");
            toast.error("Token de session invalide détecté.");
            window.location.href = "/api/auth/signout";
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'intégrité:", error);
      }
    };

    // Vérification périodique de l'intégrité (moins fréquente)
    const integrityInterval = setInterval(checkSessionIntegrity, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(integrityInterval);
  }, []);

  return <>{children}</>;
}

export default function SecureSessionProvider({ 
  children, 
  session 
}: SecureSessionProviderProps) {
  return (
    <SessionProvider 
      session={session}
      // Configuration de sécurité renforcée
      refetchInterval={5 * 60} // Actualisation toutes les 5 minutes
      refetchOnWindowFocus={true} // Actualiser au focus de la fenêtre
      refetchWhenOffline={false}
    >
      <SessionMonitorWrapper>
        {children}
      </SessionMonitorWrapper>
    </SessionProvider>
  );
}