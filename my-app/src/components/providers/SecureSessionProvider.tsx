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

      // ✅ LISTE ÉLARGIE DES CLÉS AUTORISÉES
      const allowedKeys = [
        // NextAuth
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        'next-auth.pkce.code_verifier',
        // Cookies Consent
        'cookie-consent',
        // Préférences utilisateur légitimes
        'theme',
        'language',
        'user-preferences',
        // Analytics (si consentement donné)
        '_ga',
        '_gid',
        '_gat',
        // Autres clés d'application légitimes
        'app-settings',
        'ui-state',
        'tour-completed',
        'notification-settings', 
        
      ];

      // Si c'est une clé autorisée, ce n'est pas suspect
      if (allowedKeys.some(allowedKey => 
        key === allowedKey || 
        key.includes(allowedKey) ||
        allowedKey.includes(key)
      )) {
        return false;
      }

      // ⚠️ PATTERNS VRAIMENT SUSPECTS SEULEMENT
      const sensitivePatterns = [
        /nextauth.*session.*admin/i,  // Tentative d'élévation de privilèges
        /auth.*secret.*key/i,         // Clés secrètes
        /session.*override/i,         // Tentative de override de session
        /token.*bypass/i,             // Tentative de bypass de tokens
        /<script/i,                   // Injection de script
        /javascript:/i,               // Protocole javascript
        /data:.*base64/i              // Data URL suspects
      ];

      const matchesSuspiciousPattern = sensitivePatterns.some(pattern => 
        pattern.test(key) || pattern.test(JSON.stringify(arguments))
      );

      if (matchesSuspiciousPattern) {
        console.log(`🔍 Clé suspecte détectée: ${key}`);
        return true;
      }

      // ✅ Par défaut, autoriser (approche permissive pour l'UX)
      return false;
    };

    // Surveillance des modifications non autorisées
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalGetItem = localStorage.getItem;
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

    // ✅ Ne pas intercepter getItem pour éviter les problèmes de lecture
    // localStorage.getItem reste intact pour une meilleure compatibilité

    localStorage.clear = function() {
      // Permettre clear() seulement si initié par NextAuth, app légitime ou pendant la déconnexion
      if (isInitializedRef.current) {
        const stack = new Error().stack;
        const legitimateClearSources = [
          'next-auth',
          'signOut',
          'cookie-consent', // ✅ Autoriser clear pour les cookies
          'logout',
          'clearUserData'
        ];
        
        const isLegitimate = legitimateClearSources.some(source => 
          stack?.includes(source)
        );
        
        if (!isLegitimate) {
          console.warn("🚨 Tentative de clear() non autorisée");
          handleStorageAttack('clear', 'all');
          return;
        }
      }
      return originalClear.apply(this);
    };

    // Surveillance des tentatives de modification des cookies (version allégée)
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', {
        get: originalCookieDescriptor.get,
        set: function(value: string) {
          // ✅ Surveillance plus ciblée des cookies
          if (value.includes("next-auth") || value.includes("session")) {
            // Vérifier SEULEMENT les manipulations vraiment dangereuses
            const dangerousPatterns = [
              /<script/i,                    // Injection XSS
              /javascript:/i,               // Protocole javascript
              /data:.*base64.*script/i,     // Data URL avec script
              /\.\.\/\.\.\//,               // Path traversal
              /admin.*=.*true/i             // Tentative d'élévation admin
            ];
            
            if (dangerousPatterns.some(pattern => pattern.test(value))) {
              console.warn("🚨 Tentative de manipulation dangereuse des cookies");
              toast.error("Manipulation dangereuse des cookies détectée.");
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
      localStorage.getItem = originalGetItem;
      localStorage.clear = originalClear;
      
      if (originalCookieDescriptor) {
        Object.defineProperty(document, 'cookie', originalCookieDescriptor);
      }
    };
  }, []);

  // Surveillance de l'intégrité de la session (version optimisée)
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
          // Délai plus long pour laisser NextAuth se synchroniser
          setTimeout(() => {
            const recheckCsrf = document.cookie
              .split(';')
              .find(row => row.trim().startsWith('next-auth.csrf-token'));
            
            if (!recheckCsrf) {
              toast.error("Erreur de sécurité détectée. Reconnexion requise.");
              window.location.href = "/api/auth/signout";
            }
          }, 10000); // 10 secondes au lieu de 5
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
        // ✅ Ne pas bloquer l'app en cas d'erreur de vérification
      }
    };

    // Vérification périodique de l'intégrité (moins fréquente pour les performances)
    const integrityInterval = setInterval(checkSessionIntegrity, 3 * 60 * 1000); // 3 minutes

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