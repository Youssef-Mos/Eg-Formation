'use client';

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ListeStages from "../ui-stage/LiseStage";
import StageFilter from "./StageFilter";

// Interface mise à jour avec le nouveau filtre places disponibles
type FilterValues = {
  ville: string;
  departement: string;
  date: Date | null;
  motsCles: string;
  placesDisponibles: [number, number]; // NOUVEAU : Range [min, max]
};

// Interface pour les données de stage (pour calculer le maximum)
interface Stage {
  id: number;
  Titre: string;
  Ville: string;
  PlaceDisponibles: number;
  // ... autres propriétés
}

export default function ReservationSection() {
  const { data: session } = useSession();
  
  // États pour les données
  const [stages, setStages] = useState<Stage[]>([]);
  const [villesDisponibles, setVillesDisponibles] = useState<string[]>([]);
  const [maxPlacesDisponibles, setMaxPlacesDisponibles] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);

  // État des filtres avec la nouvelle propriété
  const [filters, setFilters] = useState<FilterValues>({
    ville: "",
    departement: "",
    date: null,
    motsCles: "",
    placesDisponibles: [0, 50], // NOUVEAU : valeurs par défaut
  });

  // Fonction de réinitialisation mise à jour
  const handleResetFilters = () => {
    setFilters({
      ville: "",
      departement: "",
      date: null,
      motsCles: "",
      placesDisponibles: [0, maxPlacesDisponibles], // NOUVEAU : reset avec le max dynamique
    });
  };

  // Fetch des stages et calcul des données pour les filtres
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/Stage/RecupStage");
        
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des stages");
        }
        
        const data: Stage[] = await res.json();
        setStages(data);
        
        // Extraire les villes uniques et les trier
        const villes = Array.from(new Set(data.map((stage) => stage.Ville)))
          .filter(ville => ville && ville.trim() !== "") // Filtrer les valeurs vides
          .sort();
        setVillesDisponibles(villes);
        
        // Calculer le nombre maximum de places disponibles
        const maxPlaces = data.length > 0 
          ? Math.max(...data.map((stage) => stage.PlaceDisponibles))
          : 50; // Valeur par défaut si pas de stages
        
        setMaxPlacesDisponibles(maxPlaces);
        
        // Mettre à jour les filtres avec le nouveau maximum
        setFilters(prev => ({
          ...prev,
          placesDisponibles: [0, maxPlaces]
        }));
        
      } catch (error) {
        console.error("Erreur lors de la récupération des stages:", error);
        // Garder les valeurs par défaut en cas d'erreur
        setVillesDisponibles([]);
        setMaxPlacesDisponibles(50);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();
  }, []);

  return (
    <section className="flex flex-col gap-5 justify-center items-center">
      {/* Bouton admin pour ajouter un stage */}
      {session?.user?.role === "admin" && (
        <motion.div 
          className="mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/admin/add-stage">
            <Button 
              className="cursor-pointer hover:shadow-lg hover:shadow-zinc-300 transition-all duration-200 ease-in-out hover:scale-105" 
              variant="outline"
            >
              Ajouter un stage
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Composant de filtrage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full"
      >
        <StageFilter
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
          villesDisponibles={villesDisponibles}
          maxPlacesDisponibles={maxPlacesDisponibles} // NOUVEAU : passer le maximum
        />
      </motion.div>

      {/* Container de la liste des stages */}
      <motion.div 
        className="bg-white flex justify-center max-sm:w-full max-md:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-8xl border-2 rounded-xl hover:shadow-2xl transition-all duration-300 ease-in-out"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Chargement des stages...</p>
            </div>
          ) : (
            <ListeStages 
              filters={filters}
            />
          )}
        </div>
      </motion.div>
    </section>
  );
}