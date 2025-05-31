'use client';

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ListeStages from "../ui-stage/LiseStage";
import StageFilter from "./StageFilter";
import AgrementManagement from "@/components/admin/AgrementManagement";
import { Plus, Shield } from "lucide-react";

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
  
  // NOUVEAU : État pour gérer l'affichage du modal de gestion des agréments
  const [showAgrementManagement, setShowAgrementManagement] = useState(false);

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
      {/* Boutons admin pour ajouter un stage et gérer les agréments */}
      {session?.user?.role === "admin" && (
        <motion.div 
          className="mt-4 flex gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Bouton Ajouter un stage */}
          <Link href="/admin/add-stage">
            <Button 
              className="cursor-pointer hover:shadow-lg hover:shadow-zinc-300 transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2" 
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Ajouter un stage
            </Button>
          </Link>

          {/* NOUVEAU : Bouton Gérer les agréments */}
          <Button 
            onClick={() => setShowAgrementManagement(true)}
            className="cursor-pointer hover:shadow-lg hover:shadow-zinc-300 transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2" 
            variant="outline"
          >
            <Shield className="w-4 h-4" />
            Gérer agréments
          </Button>
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

      {/* NOUVEAU : Modal de gestion des agréments */}
      {showAgrementManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Gestion des agréments</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAgrementManagement(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            {/* Contenu du modal */}
            <AgrementManagement onClose={() => setShowAgrementManagement(false)} />
          </motion.div>
        </div>
      )}
    </section>
  );
}