'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, Clock } from "lucide-react";

export default function WaitingRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const targetUrl = searchParams.get("target");
  const [step, setStep] = useState(1);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const redirectAttempts = useRef(0);
  const maxAttempts = 30; // Maximum 30 tentatives (15 secondes)
  const startTime = useRef(Date.now());

  // ✅ Timer pour afficher le temps écoulé
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ Messages d'attente sympathiques
  const messages = [
    { step: 1, text: "Finalisation de votre inscription...", icon: <Loader2 className="w-6 h-6 animate-spin" /> },
    { step: 2, text: "Synchronisation de votre session...", icon: <Loader2 className="w-6 h-6 animate-spin" /> },
    { step: 3, text: "Préparation de votre espace...", icon: <Loader2 className="w-6 h-6 animate-spin" /> },
    { step: 4, text: "Redirection en cours...", icon: <CheckCircle2 className="w-6 h-6 text-green-500" /> },
  ];

  const currentMessage = messages.find(m => m.step === step) || messages[0];

  // ✅ Progression automatique des étapes
  useEffect(() => {
    const progressSteps = async () => {
      // Étape 1 → 2: Attendre que la connexion se propage
      setTimeout(() => {
        if (!hasRedirected) setStep(2);
      }, 1500);
      
      // Étape 2 → 3: Vérifier la session
      setTimeout(() => {
        if (!hasRedirected) setStep(3);
      }, 3000);
      
      // Étape 3 → 4: Préparer la redirection
      setTimeout(() => {
        if (!hasRedirected) setStep(4);
      }, 4500);
    };
    
    progressSteps();
  }, [hasRedirected]);

  // ✅ Surveillance intensive de la session
  useEffect(() => {
    if (hasRedirected) return;

    const checkAndRedirect = () => {
      redirectAttempts.current++;
      
      console.log(`🔄 Vérification ${redirectAttempts.current}/${maxAttempts} - Status: ${status}, User:`, session?.user?.email || 'none');

      // ✅ Session authentifiée - GO !
      if (status === 'authenticated' && session?.user) {
        console.log('✅ Session confirmée ! Redirection vers:', targetUrl || '/');
        setHasRedirected(true);
        setStep(4);
        
        // Redirection immédiate
        setTimeout(() => {
          if (targetUrl) {
            console.log('🚀 Redirection vers:', targetUrl);
            window.location.href = targetUrl;
          } else {
            console.log('🏠 Redirection vers accueil');
            router.push('/');
          }
        }, 800);
        return;
      }

      // ✅ Continuer à essayer
      if (redirectAttempts.current < maxAttempts) {
        // Vérification plus fréquente au début, puis moins fréquente
        const interval = redirectAttempts.current < 10 ? 300 : 500;
        setTimeout(checkAndRedirect, interval);
      } else {
        // ✅ Timeout - forcer la redirection
        console.log('⏰ Timeout de vérification - redirection forcée');
        setHasRedirected(true);
        setStep(4);
        
        setTimeout(() => {
          if (targetUrl) {
            console.log('🚀 Redirection forcée vers:', targetUrl);
            window.location.href = targetUrl;
          } else {
            console.log('🏠 Redirection forcée vers accueil');
            router.push('/');
          }
        }, 1000);
      }
    };

    // ✅ Démarrer la vérification après un délai initial plus court
    const initialDelay = 1000;
    setTimeout(checkAndRedirect, initialDelay);

  }, [status, session, targetUrl, router, hasRedirected]);

  // ✅ Forcer un refresh de session si nécessaire
  useEffect(() => {
    if (status === 'unauthenticated' && elapsedTime > 5 && !hasRedirected) {
      console.log('🔄 Forcer un refresh de session...');
      // Déclencher une mise à jour de session
      window.dispatchEvent(new Event('focus'));
    }
  }, [status, elapsedTime, hasRedirected]);

  // ✅ Récupérer l'ID du stage pour l'affichage
  const getStageIdFromUrl = (url: string) => {
    const match = url.match(/\/reservation\/(\d+)/);
    return match ? match[1] : null;
  };

  const stageId = targetUrl ? getStageIdFromUrl(targetUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            {currentMessage.icon}
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            🎉 Bienvenue !
          </CardTitle>
          
          <p className="text-gray-600">
            Votre compte a été créé avec succès
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message d'étape actuelle */}
          <div className="text-center space-y-3">
            <p className="text-lg font-medium text-blue-700">
              {currentMessage.text}
            </p>
            
            {stageId && (
              <p className="text-sm text-gray-600">
                📅 Préparation de votre réservation pour le stage #{stageId}
              </p>
            )}
            
            {elapsedTime > 0 && (
              <p className="text-xs text-gray-400">
                ⏱️ {elapsedTime}s écoulées
              </p>
            )}
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progression</span>
              <span>{step}/4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Étapes détaillées */}
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                  step > msg.step 
                    ? 'bg-green-50 text-green-700' 
                    : step === msg.step 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-400'
                }`}
              >
                <div className="flex-shrink-0">
                  {step > msg.step ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : step === msg.step ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Message final de redirection */}
          {step === 4 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                <ArrowRight className="w-5 h-5" />
                Redirection automatique en cours...
              </div>
              <p className="text-sm text-green-600">
                {targetUrl ? 'Accès à votre réservation...' : 'Retour à l\'accueil...'}
              </p>
            </div>
          )}

          {/* Informations de debug (développement seulement) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 text-center space-y-1 border-t pt-2">
              <p>🔧 Debug Info:</p>
              <p>Status: {status}</p>
              <p>User: {session?.user?.email || 'Aucun'}</p>
              <p>Tentatives: {redirectAttempts.current}/{maxAttempts}</p>
              <p>Target: {targetUrl || 'Accueil'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}