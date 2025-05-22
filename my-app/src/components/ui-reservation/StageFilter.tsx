'use client';

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerfilterdebut } from "./Datedébutfilter";
import { Check, ChevronsUpDown, X, Filter } from "lucide-react";
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

interface FilterValues {
  ville: string;
  departement: string;
  date: Date | null;
  motsCles: string;
}

interface StageFilterProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
  villesDisponibles: string[];
}

export default function StageFilter({
  filters,
  onFilterChange,
  onReset,
  villesDisponibles,
}: StageFilterProps) {

  const [open, setOpen] = React.useState(false);

  const handleChange = (name: keyof FilterValues, value: string | Date | null) => {
    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== "" && value !== null
  ).length;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mb-6">
        
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
                className="w-full justify-between h-11 border-gray-200 hover:border-blue-300 hover:shadow-sm focus:ring-2 focus:ring-blue-100 transition-all duration-200"
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
                        className="hover:bg-blue-50"
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
          <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
            Département
          </label>
          <Input
            placeholder="Ex: 59"
            value={filters.departement}
            onChange={(e) => handleChange("departement", e.target.value)}
            className="h-11 border-gray-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-2 group">
          <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
            Date
          </label>
          <div className="h-11">
            <DatePickerfilterdebut
              onDateChange={(date) => handleChange("date", date ?? null)}
            />
          </div>
        </div>

        {/* Mots clés */}
        <div className="flex flex-col gap-2 group">
          <label className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
            Mots-clés
          </label>
          <Input
            placeholder="Ex: Informatique"
            value={filters.motsCles}
            onChange={(e) => handleChange("motsCles", e.target.value)}
            className="h-11 border-gray-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        </div>

        {/* Bouton Reset */}
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
          <label className="text-sm font-medium text-transparent">Actions</label>
          <Button 
            variant="outline" 
            onClick={onReset}
            disabled={activeFiltersCount === 0}
            className="h-11 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
          >
            <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Indicateur de filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 px-2 py-1">Filtres actifs:</span>
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
          {filters.date && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Date sélectionnée
              <button
                onClick={() => handleChange("date", null)}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors duration-150"
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
        </div>
      )}
    </div>
  );
}