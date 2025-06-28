"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { getSession } from "next-auth/react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentButtonProps {
  stageId: number;
  stageTitle: string;
  stagePrice: number;
  typeStage: string | null;
  disabled?: boolean;
}

export default function PaymentButton({ stageId, stageTitle, stagePrice, typeStage }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        console.log("Session:", session);
        
        const uid = session?.user?.id;
        if (uid) {
          setUserId(Number(uid));
          console.log(`User ID set: ${uid}`);
        } else {
          console.error("No user ID in session:", session);
          toast.error("Utilisateur non connecté");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        toast.error("Erreur lors de la récupération de la session");
      }
    };
    
    fetchSession();
  }, []);

  const handlePayment = async () => {
    console.log("Payment requested with:", { 
      userId, 
      stageId, 
      stageTitle, 
      stagePrice,
      typeStage 
    });
    
    if (!userId) {
      toast.error("Identifiant utilisateur introuvable");
      return;
    }
    
    if (!typeStage) {
      toast.error("Veuillez sélectionner un type de stage.");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stageId, 
          stageTitle, 
          stagePrice, 
          userId, 
          typeStage 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API response error:", errorData);
        toast.error(errorData.error || "Erreur de paiement");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("Checkout session created:", data);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur: URL de paiement manquante");
      }
    } catch (error) {
      console.error("Erreur Stripe:", error);
      toast.error("Erreur lors de la création de la session de paiement");
    }
    
    setLoading(false);
  };

  return (
    <Button 
      className="cursor-pointer" 
      onClick={handlePayment} 
      disabled={loading || !userId || !typeStage}
    >
      {loading ? "En cours..." : typeStage ? "Payer" : "Sélectionnez un type de stage"}
    </Button>
  );
}