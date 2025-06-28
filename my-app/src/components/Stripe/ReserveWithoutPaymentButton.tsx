// components/ReserveWithoutPaymentButton.tsx
"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ReserveWithoutPaymentProps {
  stageId: number;
  stageTitle: string;
  stagePrice: number;
  typeStage: string | null;
  userId: number | null;
  placesDisponibles: number;
  disabled?: boolean;
}

export default function ReserveWithoutPaymentButton({
  stageId,
  stageTitle,
  stagePrice,
  typeStage,
  userId,
  placesDisponibles,
}: ReserveWithoutPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("check");

  const handleReservation = async () => {
    if (!userId) {
      toast.error("Identifiant utilisateur introuvable");
      return;
    }

    if (!typeStage) {
      toast.error("Veuillez sélectionner un type de stage.");
      return;
    }

    if (placesDisponibles <= 0) {
      toast.error("Plus de places disponibles pour ce stage.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservation/create-without-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          userId,
          typeStage,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API response error:", errorData);
        toast.error(errorData.error || "Erreur de réservation");
        setLoading(false);
        return;
      }

      const data = await res.json();
      toast.success("Réservation effectuée avec succès");
      // Rediriger vers la page de confirmation
      window.location.href = `/profil`;
    } catch (error) {
      console.error("Erreur de réservation:", error);
      toast.error("Erreur lors de la réservation");
    }
    
    setIsOpen(false);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={loading || !userId || !typeStage}
          onClick={() => setIsOpen(true)}
        >
          Réserver sans payer maintenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisissez un mode de paiement</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Votre réservation sera confirmée sous réserve de réception du paiement par le moyen choisi.
          </p>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={setPaymentMethod}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="check" id="check" />
              <Label htmlFor="check">Paiement par chèque</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash">Paiement en espèces</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer">Virement bancaire</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleReservation} 
            disabled={loading}
          >
            {loading ? "Traitement..." : "Confirmer la réservation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}