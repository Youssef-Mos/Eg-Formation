

import React from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import CancelReservationDialog from "@/components/ui-reservation/CancelResa";
import PaymentButton from "@/components/Stripe/paymentButton";

interface ReservationParams {
  id: string;
}

// Fonction asynchrone pour récupérer le stage à partir de l'API
async function getStage(id: string) {
  // Remplacez l'URL par le chemin adéquat si besoin.
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/Stage/RecupStage`, { 
    next: { revalidate: 60 } 
  });
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération du stage");
  }
  const stages = await res.json();
  const stage = stages.find((s: any) => s.id === Number(id));
  return stage;
}

export default async function ReservationPage({ params }: { params: ReservationParams }) {
    
  const stage = await getStage(params.id);
  if (!stage) {
    notFound();
  }

  


  return (
    <div className="container mx-auto p-4">
      

      <div className="flex flex-col mt-8 border gap-2 p-4 rounded-2xl shadow-md bg-zinc-50">
      <h1 className="text-center font-bold text-2xl mb-3">Récapitulatif de votre réservation pour le {stage.Titre}</h1>
        <p className="mb-2"><strong>Adresse : </strong>{stage.Adresse}, {stage.CodePostal} {stage.Ville}</p>
        <p className="mb-2">
          <strong>Dates : </strong>
          {new Date(stage.DateDebut).toLocaleDateString("fr-FR")} - {new Date(stage.DateFin).toLocaleDateString("fr-FR")}
        </p>
        <p className="mb-2"><strong>Horaires : </strong>{stage.HeureDebut} - {stage.HeureFin}</p>
        <p className="mb-2"><strong>Prix : </strong>{stage.Prix}€</p>

        <div className="flex flex-col border w-lg gap-2 justify-center">
            <h1 className="text-center font-bold mb-2.5 text-xl">Type de stage :</h1>
        <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer items-center flex justify-center"  
                      value="male"
                      /> 
                    <p>Cas n°1 : Récupération des points</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer items-center flex justify-center"  
                      value="male"
                      /> 
                    <p>Cas n°2 : Permis probatoire (lettre Réf. 48N)</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer items-center flex justify-center"  
                      value="male"
                      /> 
                    <p> Cas n°3 : Alternative aux poursuites pénales</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer items-center flex justify-center"  
                      value="male"
                      /> 
                    <p>Cas n°4 : Peine complémentaire</p>
                  </div>
        </div>
        <div className="flex gap-1 justify-end">
        
        <CancelReservationDialog />
        <PaymentButton stageId={stage.id} 
            stageTitle={stage.Titre} 
            stagePrice={stage.Prix} 
          />
        
        </div>
      </div>

      {/* Ici, vous pouvez insérer un formulaire de réservation ou d'autres fonctionnalités selon vos besoins */}
    </div>
  );
}
