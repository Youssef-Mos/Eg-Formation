"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PaymentButton from "@/components/Stripe/paymentButton";
import ReserveWithoutPaymentButton from "@/components/Stripe/ReserveWithoutPaymentButton";
import CancelReservationDialog from "@/components/ui-reservation/CancelResa";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

export default function ReservationFormClient({ stage }: { stage: any }) {
  const [typeStage, setTypeStage] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Récupérer la session et l'ID utilisateur
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        console.log("Session:", session);
        const uid = session?.user?.id;
        if (uid) {
          setUserId(Number(uid));
        } else {
          console.error("No user ID in session:", session);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };
    
    fetchSession();
  }, []);
  
  // Log when type changes for debugging
  useEffect(() => {
    console.log("Type de stage sélectionné:", typeStage);
  }, [typeStage]);
  
  const handleTypeChange = (value: string) => {
    setTypeStage(value);
    console.log(`Type changé à: ${value}`);
  };
  
  return (
    <div className="flex flex-col mt-8 border gap-2 p-4 rounded-2xl shadow-md bg-zinc-50">
      <h1 className="text-center font-bold text-2xl mb-3">
        Récapitulatif de votre réservation pour le {stage.Titre}
      </h1>
      {/* Infos stage */}
      <p><strong>Adresse : </strong>{stage.Adresse}, {stage.CodePostal} {stage.Ville}</p>
      <p><strong>Dates : </strong>{new Date(stage.DateDebut).toLocaleDateString("fr-FR")} - {new Date(stage.DateFin).toLocaleDateString("fr-FR")}</p>
      <p><strong>Horaires : </strong>{stage.HeureDebut} - {stage.HeureFin}</p>
      <p><strong>Prix : </strong>{stage.Prix}€</p>
      <p><strong>Places disponibles : </strong>{stage.PlaceDisponibles}</p>
      
      {/* Sélection du type de stage */}
      <div className="border-2 border-zinc-700 rounded-2xl p-4 mt-4">
        <h2 className="text-xl font-bold mb-3">Type de stage :</h2>
        {[
          { value: "recuperation_points", label: "Cas n°1 : Récupération des points" },
          { value: "permis_probatoire", label: "Cas n°2 : Permis probatoire (lettre Réf. 48N)" },
          { value: "alternative_poursuites", label: "Cas n°3 : Alternative aux poursuites pénales" },
          { value: "peine_complementaire", label: "Cas n°4 : Peine complémentaire" },
        ].map(({ value, label }) => (
          <div key={value} className="flex gap-2 pl-3 mb-2">
            <input
              type="radio"
              id={`type-${value}`}
              name="typeStage"
              value={value}
              checked={typeStage === value}
              onChange={() => handleTypeChange(value)}
              className="radio-md cursor-pointer"
            />
            <label htmlFor={`type-${value}`} className="cursor-pointer">{label}</label>
          </div>
        ))}
      </div>
      
      {/* Boutons */}
      <div className="flex flex-wrap gap-3 justify-end mt-6">
        <CancelReservationDialog />
        <ReserveWithoutPaymentButton
          stageId={stage.id}
          stageTitle={stage.Titre}
          stagePrice={stage.Prix}
          typeStage={typeStage}
          userId={userId}
          placesDisponibles={stage.PlaceDisponibles}
        />
        <PaymentButton
          stageId={stage.id}
          stageTitle={stage.Titre}
          stagePrice={stage.Prix}
          typeStage={typeStage}
        />
      </div>
    </div>
  );
}