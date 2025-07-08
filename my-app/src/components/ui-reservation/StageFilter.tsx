'use client';

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DatePickerfilterdebut } from "./Datedébutfilter";
import { Check, ChevronsUpDown, X, Filter, Users, Calendar, Clock, CheckCircle } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ✅ INTERFACE MISE À JOUR avec nouveau champ statut et date renommée
interface FilterValues {
  ville: string;
  departement: string;
  dateDebut: Date | null; // ✅ Renommé de "date" vers "dateDebut" pour plus de clarté
  motsCles: string;
  placesDisponibles: [number, number];
  statutStage: 'tout' | 'en-cours' | 'termines'; // ✅ NOUVEAU champ pour le statut
}

interface StageFilterProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
  villesDisponibles: string[];
  maxPlacesDisponibles?: number;
}

// ✅ OPTIONS de statut mises à jour
const STATUT_OPTIONS = [
  { value: 'tout', label: 'Tous les stages', icon: Calendar, color: 'text-gray-600' },
  { value: 'en-cours', label: 'Stages disponibles', icon: Clock, color: 'text-green-600' },
  { value: 'termines', label: 'Stages terminés', icon: CheckCircle, color: 'text-slate-600' }
] as const;

export default function StageFilter({
  filters,
  onFilterChange,
  onReset,
  villesDisponibles,
  maxPlacesDisponibles = 50,
}: StageFilterProps) {

  const [open, setOpen] = React.useState(false);

  const handleChange = (name: keyof FilterValues, value: string | Date | null | [number, number]) => {
    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  // ✅ COMPTAGE MIS À JOUR des filtres actifs avec nouveau champ statutStage
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'placesDisponibles') {
      const [min, max] = value as [number, number];
      return min > 0 || max < maxPlacesDisponibles;
    }
    if (key === 'statutStage') {
      return value !== 'tout'; // ✅ Le filtre statut est actif si différent de "tout"
    }
    return value !== "" && value !== null;
  }).length;

  // Vérifier si le filtre places est actif
  const isPlacesFilterActive = () => {
    const [min, max] = filters.placesDisponibles;
    return min > 0 || max < maxPlacesDisponibles;
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-sm p-4 sm:p-6 mb-8 rounded-2xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out">
      
      {/* Header avec icône */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
          <Filter className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Filtrer les stages</h3>
          <p className="text-sm text-gray-500">
            {activeFiltersCount > 0 ? `${activeFiltersCount} filtre(s) actif(s)` : "Aucun filtre appliqué"}
          </p>
        </div>
      </div>

      {/* Grille responsive des filtres */}
      <div className="space-y-6">
        {/* ✅ NOUVELLE PREMIÈRE LIGNE : Statut des stages */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Afficher les stages
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STATUT_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              const isSelected = filters.statutStage === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleChange('statutStage', option.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium",
                    isSelected
                      ? "bg-white border-blue-300 shadow-sm text-blue-700 ring-2 ring-blue-100"
                      : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <IconComponent className={cn("w-4 h-4", isSelected ? "text-blue-600" : option.color)} />
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deuxième ligne : Filtres principaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* VILLE - Combobox */}
          <div className="flex flex-col gap-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
              Ville
            </label>
            
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full   justify-between h-11 border-gray-200 hover:border-blue-300 hover:shadow-sm focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                >
                  <span className={cn(
                    "truncate",
                    filters.ville ? "text-gray-900" : "text-gray-500"
                  )}>
                    {filters.ville || "Sélectionne une ville"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 shadow-lg border-gray-200">
                <Command>
                  <CommandInput placeholder="Recherche une ville..." className="h-10" />
                  <CommandList>
                    <CommandEmpty>Pas de ville trouvée.</CommandEmpty>
                    <CommandGroup>
                      {villesDisponibles.map((ville) => (
                        <CommandItem
                          key={ville}
                          value={ville}
                          onSelect={(currentValue) => {
                            handleChange("ville", currentValue === filters.ville ? "" : currentValue);
                            setOpen(false);
                          }}
                          className="hover:bg-blue-50 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-blue-600",
                              filters.ville === ville ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {ville}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Département */}
          <div className="flex flex-col gap-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors duration-200">
              Département
            </label>
            <Input
              placeholder="Ex: 59"
              value={filters.departement}
              onChange={(e) => handleChange("departement", e.target.value)}
              className="h-11 border-gray-200 hover:border-green-300 focus:ring-2 focus:ring-green-100 transition-all duration-200"
            />
          </div>

          {/* ✅ DATE MODIFIÉE : "À partir de cette date" */}
          <div className="flex flex-col gap-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors duration-200">
              À partir de cette date
            </label>
            <div className="h-11">
              <DatePickerfilterdebut
                onDateChange={(date) => handleChange("dateDebut", date ?? null)}
              />
            </div>
            {/* ✅ NOUVEAU : Explication pour clarifier le comportement */}
            {filters.dateDebut && (
              <p className="text-xs text-amber-600 mt-1">
                Affiche les stages qui commencent à partir du {new Date(filters.dateDebut).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          {/* Mots clés */}
          <div className="flex flex-col gap-2 group">
            <label className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors duration-200">
              Mots-clés
            </label>
            <Input
              placeholder="Ex: Informatique"
              value={filters.motsCles}
              onChange={(e) => handleChange("motsCles", e.target.value)}
              className="h-11 border-gray-200 hover:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
            />
          </div>
        </div>

        {/* Troisième ligne : Slider Places et Bouton Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Places disponibles - Slider */}
          <div className="flex flex-col gap-2 group lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors duration-200 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Places disponibles
              <span className="text-xs text-gray-500 font-normal">
                ({filters.placesDisponibles[0]} - {filters.placesDisponibles[1]} places)
              </span>
            </label>
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all duration-200 group-hover:shadow-sm">
              <div className="space-y-3">
                <Slider
                  value={filters.placesDisponibles}
                  onValueChange={(value) => handleChange("placesDisponibles", value as [number, number])}
                  max={maxPlacesDisponibles}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col items-start">
                    <span className="text-gray-500">Minimum</span>
                    <span className={cn(
                      "font-semibold text-sm transition-colors duration-200",
                      filters.placesDisponibles[0] > 0 ? "text-purple-600" : "text-gray-500"
                    )}>
                      {filters.placesDisponibles[0]} places
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="h-px bg-gray-300 w-8"></div>
                    <span>à</span>
                    <div className="h-px bg-gray-300 w-8"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500">Maximum</span>
                    <span className={cn(
                      "font-semibold text-sm transition-colors duration-200",
                      filters.placesDisponibles[1] < maxPlacesDisponibles ? "text-purple-600" : "text-gray-500"
                    )}>
                      {filters.placesDisponibles[1]} places
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Reset */}
          <div className="flex flex-col gap-2 justify-end">
            <label className="text-sm font-medium text-transparent">Actions</label>
            <Button 
              variant="outline" 
              onClick={onReset}
              disabled={activeFiltersCount === 0}
              className="h-12 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-medium">Réinitialiser</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ INDICATEUR MIS À JOUR des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 px-2 py-1">Filtres actifs:</span>
          
          {/* ✅ NOUVEAU : Badge statut */}
          {filters.statutStage !== 'tout' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              <Calendar className="w-3 h-3" />
              {STATUT_OPTIONS.find(opt => opt.value === filters.statutStage)?.label}
              <button
                onClick={() => handleChange("statutStage", "tout")}
                className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.ville && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Ville: {filters.ville}
              <button
                onClick={() => handleChange("ville", "")}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.departement && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Dép: {filters.departement}
              <button
                onClick={() => handleChange("departement", "")}
                className="hover:bg-green-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {/* ✅ MODIFIÉ : Badge date avec nouveau libellé */}
          {filters.dateDebut && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              À partir du {new Date(filters.dateDebut).toLocaleDateString('fr-FR')}
              <button
                onClick={() => handleChange("dateDebut", null)}
                className="hover:bg-amber-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.motsCles && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              Mots-clés: {filters.motsCles}
              <button
                onClick={() => handleChange("motsCles", "")}
                className="hover:bg-orange-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {isPlacesFilterActive() && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              <Users className="w-3 h-3" />
              Places: {filters.placesDisponibles[0]}-{filters.placesDisponibles[1]}
              <button
                onClick={() => handleChange("placesDisponibles", [0, maxPlacesDisponibles])}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors duration-150"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}