'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";

interface Stage {
  id: number;
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: Date;
  DateFin: Date;
  HeureDebut: string;
  HeureFin: string;
  Prix: number;
}

export default function ListeStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch("/api/Stage/RecupStage");
        if (!res.ok) throw new Error("Erreur de récupération");
        
        const data = await res.json();
        setStages(data);
      } catch (error) {
        console.error(error);
        toast.error("Erreur réseau");
      }
    };

    fetchStages();
  }, []);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };


  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/Stage/DeleteStage/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      // Mise à jour de l'état en retirant le stage supprimé
      setStages((prevStages) => prevStages.filter(stage => stage.id !== id));
      toast.success("Stage supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error("Erreur lors de la suppression du stage");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Liste des stages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="cursor-pointer border border-cyan-300 p-4 rounded-lg shadow-md bg-cyan-100 hover:shadow-lg hover:shadow-cyan-400 transition-all duration-200 ease-in hover:bg-cyan-200 hover:border-cyan-600 xl:w-lg">
            <h2 className="text-xl font-semibold mb-2">{stage.Titre}</h2>
            <p className="mb-1">{stage.Adresse}</p>
            <p className="mb-1">{stage.CodePostal} {stage.Ville}</p>
            <p className="mb-1">Places disponibles: {stage.PlaceDisponibles}</p>
            <p className="mb-1">
              Dates: {formatDate(stage.DateDebut)} au {formatDate(stage.DateFin)}
            </p>
            <p className="mb-1">Horaires: {stage.HeureDebut} - {stage.HeureFin}</p>
            <p className="text-lg font-bold mt-2">Prix: {stage.Prix}€</p>

            {session?.user?.role === "admin" && (
              <div className="flex gap-2 justify-end">
              <Button
                variant="destructive" className="cursor-pointer"
                onClick={() => handleDelete(stage.id)}
              >
                Supprimer
              </Button>
              <Button variant="default" className="cursor-pointer">
                Modifier
              </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}