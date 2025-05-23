// components/CookieConsent.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Cookie, Settings, X, Check, Info } from 'lucide-react';
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

// Hook pour gérer les cookies
type ConsentData = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie-consent');
    if (savedConsent) {
      setConsent(JSON.parse(savedConsent));
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (consentData: ConsentData) => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...consentData,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    setConsent(consentData);
    setShowBanner(false);
    
    // Déclencher les scripts selon le consentement
    initializeScripts(consentData);
  };

  const hasConsent = (category: keyof ConsentData) => {
    return consent?.[category] === true;
  };

  const revokeConsent = () => {
    localStorage.removeItem('cookie-consent');
    setConsent(null);
    setShowBanner(true);
    
    // Supprimer les cookies non nécessaires
    clearNonEssentialCookies();
  };

  return { consent, showBanner, saveConsent, hasConsent, revokeConsent, setShowBanner };
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
    // Initialiser les scripts marketing
    console.log('Marketing cookies accepted');
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
  const { showBanner, saveConsent, setShowBanner } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

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
      {/* Banner principal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Nous utilisons des cookies
                </h3>
                <p className="text-sm text-gray-600">
                  Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
                  Certains sont essentiels, d'autres nous aident à analyser le trafic et à personnaliser le contenu.
                  <button 
                    onClick={() => setShowDetails(true)}
                    className="text-blue-600 hover:underline ml-1"
                  >
                    En savoir plus
                  </button>
                </p>
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
              Choisissez quels cookies vous souhaitez autoriser. Vous pouvez modifier ces paramètres à tout moment.
            </DialogDescription>
          </DialogHeader>
          
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
  const { consent, revokeConsent } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  if (!consent) return null;

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Vos préférences actuelles
      </h4>
      
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