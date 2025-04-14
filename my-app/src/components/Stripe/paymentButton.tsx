"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

// Charge Stripe avec ta clé publishable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentButtonProps {
  stageId: number;
  stageTitle: string;
  stagePrice: number;
}

export default function PaymentButton({ stageId, stageTitle, stagePrice }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, stageTitle, stagePrice }),
      });
      const data = await res.json();
      if (data.url) {
        // Redirige l'utilisateur vers Stripe
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
    <Button className="cursor-pointer" onClick={handlePayment} disabled={loading}>
      {loading ? "En cours..." : "Payer"}
    </Button>
  );
}
