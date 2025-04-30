"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { getSession } from "next-auth/react"; // <--- importe getSession

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentButtonProps {
  stageId: number;
  stageTitle: string;
  stagePrice: number;
}

export default function PaymentButton({ stageId, stageTitle, stagePrice }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      const uid = session?.user?.id;
      if (uid) {
        setUserId(Number(uid));
      } else {
        toast.error("Utilisateur non connecté");
      }
    };

    fetchSession();
  }, []);

  const handlePayment = async () => {
    if (!userId) {
      toast.error("Identifiant utilisateur introuvable");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, stageTitle, stagePrice, userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error("Erreur Stripe:", error);
      toast.error("Erreur lors de la création de la session de paiement");
    }
    setLoading(false);
  };

  return (
    <Button className="cursor-pointer" onClick={handlePayment} disabled={loading || !userId}>
      {loading ? "En cours..." : "Payer"}
    </Button>
  );
}
