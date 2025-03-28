'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des stages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="border p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{stage.Titre}</h2>
            <p className="mb-1">{stage.Adresse}</p>
            <p className="mb-1">{stage.CodePostal} {stage.Ville}</p>
            <p className="mb-1">Places disponibles: {stage.PlaceDisponibles}</p>
            <p className="mb-1">
              Dates: {formatDate(stage.DateDebut)} au {formatDate(stage.DateFin)}
            </p>
            <p className="mb-1">Horaires: {stage.HeureDebut} - {stage.HeureFin}</p>
            <p className="text-lg font-bold mt-2">Prix: {stage.Prix}€</p>
          </div>
        ))}
      </div>
    </div>
  );
}