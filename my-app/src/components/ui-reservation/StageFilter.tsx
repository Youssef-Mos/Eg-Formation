'use client';

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerfilterdebut } from "./Datedébutfilter";
import { Check, ChevronsUpDown } from "lucide-react";
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

  return (
    <div className="w-full lg:w-6xl xl:w-7xl bg-white p-6 mb-8 rounded-xl border shadow-sm flex flex-col gap-6 md:flex-row md:items-end md:gap-6">
      
      {/* VILLE - Combobox */}
      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-sm text-muted-foreground">Ville</label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {filters.ville
                ? filters.ville
                : "Sélectionne ou tape une ville"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Recherche une ville..." />
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
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
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
      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-sm text-muted-foreground">Département</label>
        <Input
          placeholder="Ex: 59"
          value={filters.departement}
          onChange={(e) => handleChange("departement", e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-sm text-muted-foreground">Date</label>
        <DatePickerfilterdebut
          onDateChange={(date) => handleChange("date", date ?? null)}
        />
      </div>

      {/* Mots clés */}
      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-sm text-muted-foreground">Mots-clés</label>
        <Input
          placeholder="Ex: Informatique"
          value={filters.motsCles}
          onChange={(e) => handleChange("motsCles", e.target.value)}
        />
      </div>

      {/* Reset */}
      <div className="flex items-end">
        <Button variant="outline" onClick={onReset}>Réinitialiser</Button>
      </div>
    </div>
  );
}
