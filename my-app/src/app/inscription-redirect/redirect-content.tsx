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
  const redirectAttempts = useRef(0);
  const maxAttempts = 20; // Maximum 20 tentatives (10 secondes)

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
      // Étape 1: Attendre un peu pour que la connexion se propage
      setTimeout(() => setStep(2), 1000);
      
      // Étape 2: Vérifier la session
      setTimeout(() => setStep(3), 2000);
      
      // Étape 3: Préparer la redirection
      setTimeout(() => setStep(4), 3000);
    };
    
    progressSteps();
  }, []);

  // ✅ Surveillance de la session et redirection automatique
  useEffect(() => {
    if (hasRedirected) return;

    const checkAndRedirect = () => {
      redirectAttempts.current++;
      
      console.log(`🔄 Tentative ${redirectAttempts.current} - Status: ${status}, Session:`, !!session);

      // ✅ Session prête - REDIRECTION !
      if (status === 'authenticated' && session?.user) {
        console.log('✅ Session confirmée, redirection vers:', targetUrl || '/');
        setHasRedirected(true);
        
        setTimeout(() => {
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
            router.push('/');
          }
        }, 500);
        return;
      }

      // ✅ Continuer à essayer si on n'a pas atteint la limite
      if (redirectAttempts.current < maxAttempts) {
        setTimeout(checkAndRedirect, 500); // Vérifier toutes les 500ms
      } else {
        // ✅ Redirection de secours après timeout
        console.log('⏰ Timeout atteint, redirection forcée');
        setHasRedirected(true);
        
        if (targetUrl) {
          window.location.href = targetUrl;
        } else {
          router.push('/');
        }
      }
    };

    // ✅ Démarrer la vérification après un délai initial
    setTimeout(checkAndRedirect, 2000);
  }, [status, session, targetUrl, router, hasRedirected]);

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

          {/* Étapes */}
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

          {/* Information de session (debug) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>Status: {status}</p>
              <p>Session: {session?.user?.email || 'Non connecté'}</p>
              <p>Tentatives: {redirectAttempts.current}/{maxAttempts}</p>
            </div>
          )}

          {/* Message final */}
          {step === 4 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                <ArrowRight className="w-4 h-4" />
                Redirection automatique...
              </div>
              <p className="text-sm text-green-600 mt-1">
                Vous allez être redirigé dans quelques instants
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}