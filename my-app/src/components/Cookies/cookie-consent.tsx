// components/CookieConsent.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Cookie, Settings, X, Check, Info, Clock, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Types de cookies
const COOKIE_CATEGORIES = {
  necessary: {
    name: 'Cookies nécessaires',
    description: 'Ces cookies sont essentiels au fonctionnement du site.',
    required: true,
    cookies: ['session', 'auth', 'csrf']
  },
  analytics: {
    name: 'Cookies analytiques',
    description: 'Nous aident à comprendre comment vous utilisez notre site.',
    required: false,
    cookies: ['_ga', '_gid', '_gat']
  },
  marketing: {
    name: 'Cookies marketing',
    description: 'Utilisés pour vous proposer du contenu personnalisé.',
    required: false,
    cookies: ['_fbp', '_fbc']
  },
  preferences: {
    name: 'Cookies de préférences',
    description: 'Mémorisent vos préférences et paramètres.',
    required: false,
    cookies: ['theme', 'language']
  }
};

// Hook pour gérer les cookies avec expiration
type ConsentData = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

type SavedConsentData = ConsentData & {
  timestamp: string;
  version: string;
  sessionId: string;
};

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // ✅ Constantes de configuration
  const CONSENT_EXPIRY_HOURS = 24; // Expiration après 24h
  const STORAGE_KEY = 'cookie-consent';
  const CURRENT_VERSION = '2.0';

  // Générer un ID de session unique
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Vérifier si le consentement a expiré
  const isConsentExpired = (savedData: SavedConsentData): boolean => {
    if (!savedData.timestamp) return true;
    
    const savedTime = new Date(savedData.timestamp).getTime();
    const currentTime = Date.now();
    const expiryTime = CONSENT_EXPIRY_HOURS * 60 * 60 * 1000; // 24h en ms
    
    return (currentTime - savedTime) > expiryTime;
  };

  // Vérifier si c'est une nouvelle session (détection redémarrage serveur)
  const isNewSession = (savedData: SavedConsentData): boolean => {
    const currentSessionId = sessionStorage.getItem('current-session-id');
    if (!currentSessionId) {
      // Première fois dans cette session
      sessionStorage.setItem('current-session-id', generateSessionId());
      return savedData.sessionId !== sessionStorage.getItem('current-session-id');
    }
    return false;
  };

  // Charger et vérifier le consentement
  useEffect(() => {
    const checkConsent = () => {
      try {
        const savedConsent = localStorage.getItem(STORAGE_KEY);
        
        if (!savedConsent) {
          console.log("🍪 Aucun consentement trouvé - Affichage du banner");
          setShowBanner(true);
          return;
        }

        const parsedData: SavedConsentData = JSON.parse(savedConsent);

        // ✅ Vérifications d'expiration
        const expired = isConsentExpired(parsedData);
        const newSession = isNewSession(parsedData);
        const versionChanged = parsedData.version !== CURRENT_VERSION;

        if (expired) {
          console.log("🍪 Consentement expiré (24h dépassées) - Redemande");
          setIsExpired(true);
          setShowBanner(true);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        if (newSession) {
          console.log("🍪 Nouvelle session détectée - Redemande");
          setShowBanner(true);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        if (versionChanged) {
          console.log("🍪 Version du consentement changée - Redemande");
          setShowBanner(true);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Consentement valide
        console.log("🍪 Consentement valide trouvé");
        setConsent({
          necessary: parsedData.necessary,
          analytics: parsedData.analytics,
          marketing: parsedData.marketing,
          preferences: parsedData.preferences,
        });
        
        // Initialiser les scripts selon le consentement
        initializeScripts({
          necessary: parsedData.necessary,
          analytics: parsedData.analytics,
          marketing: parsedData.marketing,
          preferences: parsedData.preferences,
        });

      } catch (error) {
        console.error("🍪 Erreur lors du chargement du consentement:", error);
        setShowBanner(true);
      }
    };

    checkConsent();

    // ✅ Surveillance de l'expiration en temps réel
    const expiryCheck = setInterval(() => {
      const savedConsent = localStorage.getItem(STORAGE_KEY);
      if (savedConsent) {
        try {
          const parsedData: SavedConsentData = JSON.parse(savedConsent);
          if (isConsentExpired(parsedData)) {
            console.log("🍪 Consentement expiré détecté - Nettoyage");
            localStorage.removeItem(STORAGE_KEY);
            setConsent(null);
            setShowBanner(true);
            setIsExpired(true);
          }
        } catch (error) {
          console.error("🍪 Erreur vérification expiration:", error);
        }
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(expiryCheck);
  }, []);

  // ✅ Surveiller la fermeture de la page/onglet
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Option 1: Expirer le consentement à la fermeture (plus strict)
      // localStorage.removeItem(STORAGE_KEY);
      
      // Option 2: Marquer pour expiration rapide au prochain chargement
      const savedConsent = localStorage.getItem(STORAGE_KEY);
      if (savedConsent) {
        try {
          const parsedData: SavedConsentData = JSON.parse(savedConsent);
          const updatedData = {
            ...parsedData,
            shouldReask: true, // Flag pour redemander au prochain chargement
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        } catch (error) {
          console.error("🍪 Erreur marking for reask:", error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page devient invisible (onglet fermé/changé)
        handleBeforeUnload();
      }
    };

    // Écouter les événements de fermeture
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const saveConsent = (consentData: ConsentData) => {
    const currentSessionId = sessionStorage.getItem('current-session-id') || generateSessionId();
    sessionStorage.setItem('current-session-id', currentSessionId);

    const dataToSave: SavedConsentData = {
      ...consentData,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
      sessionId: currentSessionId,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    setConsent(consentData);
    setShowBanner(false);
    setIsExpired(false);
    
    console.log("🍪 Consentement sauvegardé:", dataToSave);
    
    // Déclencher les scripts selon le consentement
    initializeScripts(consentData);
  };

  const hasConsent = (category: keyof ConsentData) => {
    return consent?.[category] === true;
  };

  const revokeConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('current-session-id');
    setConsent(null);
    setShowBanner(true);
    setIsExpired(false);
    
    // Supprimer les cookies non nécessaires
    clearNonEssentialCookies();
    
    console.log("🍪 Consentement révoqué");
  };

  const getConsentInfo = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed: SavedConsentData = JSON.parse(savedData);
        const timeLeft = CONSENT_EXPIRY_HOURS * 60 * 60 * 1000 - (Date.now() - new Date(parsed.timestamp).getTime());
        const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
        
        return {
          timestamp: new Date(parsed.timestamp),
          version: parsed.version,
          sessionId: parsed.sessionId,
          hoursLeft,
          isExpiringSoon: hoursLeft <= 2,
        };
      }
    } catch (error) {
      console.error("🍪 Erreur lecture info consentement:", error);
    }
    return null;
  };

  return { 
    consent, 
    showBanner, 
    saveConsent, 
    hasConsent, 
    revokeConsent, 
    setShowBanner, 
    isExpired,
    getConsentInfo
  };
};

// Fonction pour initialiser les scripts selon le consentement
const initializeScripts = (consent: ConsentData) => {
  // Google Analytics
  if (consent.analytics && process.env.NEXT_PUBLIC_GA_ID) {
    // Assure dataLayer is defined
    (window as any).dataLayer = (window as any).dataLayer || [];
    window.gtag = window.gtag || function(){(window as any).dataLayer.push(arguments);};
    window.gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
    
    // Charger GA4 si pas déjà fait
    if (!window.GA_INITIALIZED) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        if (typeof window.gtag === 'function') {
          window.gtag('js', new Date());
          window.gtag('config', process.env.NEXT_PUBLIC_GA_ID);
        }
        window.GA_INITIALIZED = true;
      };
    }
  } else {
    // Désactiver GA
    window.gtag && window.gtag('consent', 'update', {
      'analytics_storage': 'denied'
    });
  }

  // Autres scripts (Facebook Pixel, etc.)
  if (consent.marketing) {
    console.log('🍪 Marketing cookies accepted');
  }
};

// Fonction pour supprimer les cookies non essentiels
const clearNonEssentialCookies = () => {
  const allCookies = document.cookie.split(';');
  
  allCookies.forEach(cookie => {
    const [name] = cookie.split('=');
    const cleanName = name.trim();
    
    // Liste des cookies à préserver (essentiels)
    const essentialCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token'
    ];
    
    if (!essentialCookies.includes(cleanName)) {
      // Supprimer le cookie
      document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
};

// Composant principal du banner
export default function CookieConsent() {
  const { showBanner, saveConsent, setShowBanner, isExpired, getConsentInfo } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  const consentInfo = getConsentInfo();

  if (!showBanner) return null;

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const savePreferences = () => {
    saveConsent(preferences);
    setShowDetails(false);
  };

  return (
    <>
      {/* Banner principal avec indicateur d'expiration */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto">
          {/* ✅ Indicateur d'expiration */}
          {isExpired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Votre consentement a expiré (24h dépassées) - Merci de confirmer vos préférences
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isExpired ? "Renouvellement du consentement requis" : "Nous utilisons des cookies"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isExpired 
                    ? "Votre consentement a expiré après 24h. Veuillez confirmer vos préférences pour continuer."
                    : "Nous utilisons des cookies pour améliorer votre expérience. Certains sont essentiels, d'autres nous aident à analyser le trafic."
                  }
                  <button 
                    onClick={() => setShowDetails(true)}
                    className="text-blue-600 hover:underline ml-1"
                  >
                    En savoir plus
                  </button>
                </p>
                
                {/* ✅ Info sur l'expiration */}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Le consentement expire automatiquement après 24h</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptNecessary}
                className="w-full sm:w-auto"
              >
                Nécessaires uniquement
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Accepter tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="w-4 h-4 mr-1" />
                Personnaliser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Paramètres des cookies
            </DialogTitle>
            <DialogDescription>
              Choisissez quels cookies vous souhaitez autoriser. Ces paramètres expirent automatiquement après 24h pour respecter votre vie privée.
            </DialogDescription>
          </DialogHeader>

          {/* ✅ Informations sur l'expiration */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">À propos de l'expiration</h4>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Votre consentement expire automatiquement après 24 heures</p>
              <p>• Le banner réapparaîtra si vous quittez puis revenez sur le site</p>
              <p>• Nous redemandons votre consentement après un redémarrage du serveur</p>
              <p>• Vous pouvez modifier vos préférences à tout moment dans les paramètres</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <Switch
                    checked={preferences[key as keyof typeof preferences]}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({...prev, [key as keyof typeof preferences]: checked}))
                    }
                    disabled={category.required}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                
                {/* Liste des cookies */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    Voir les cookies ({category.cookies.length})
                  </summary>
                  <div className="mt-2 pl-4 space-y-1">
                    {category.cookies.map(cookie => (
                      <div key={cookie} className="text-gray-500">• {cookie}</div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDetails(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={savePreferences} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Enregistrer mes préférences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Composant pour afficher les paramètres de cookies dans les mentions légales
export function CookieSettings() {
  const { consent, revokeConsent, getConsentInfo } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  if (!consent) return null;

  const consentInfo = getConsentInfo();

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Vos préférences actuelles
      </h4>

      {/* ✅ Informations détaillées sur le consentement */}
      {consentInfo && (
        <div className="bg-white p-3 rounded border mb-4">
          <div className="text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span>Consentement donné le :</span>
              <span className="font-mono text-xs">{consentInfo.timestamp.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Temps restant :</span>
              <span className={`font-medium ${consentInfo.isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {consentInfo.hoursLeft}h
                {consentInfo.isExpiringSoon && (
                  <span className="ml-1 text-orange-600">
                    <AlertTriangle className="w-3 h-3 inline" />
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Version :</span>
              <span className="font-mono text-xs">{consentInfo.version}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2 text-sm">
        {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
          <div key={key} className="flex justify-between items-center">
            <span>{category.name}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              consent[key as keyof ConsentData] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {consent[key as keyof ConsentData] ? 'Autorisé' : 'Refusé'}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setShowSettings(true)}
        >
          Modifier les préférences
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={revokeConsent}
        >
          Révoquer le consentement
        </Button>
      </div>

      {/* Modal pour modifier les paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <CookieConsent />
        </DialogContent>
      </Dialog>
    </div>
  );
}