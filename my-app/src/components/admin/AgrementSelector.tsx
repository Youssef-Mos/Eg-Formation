// components/admin/AgrementSelector.tsx
'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AddAgrement from "./AddAgrements"; // Garde ton import existant
import { toast } from "sonner";
import { 
  Shield, 
  Plus, 
  MapPin, 
  Hash,
  AlertCircle,
  Loader2
} from "lucide-react";

interface Agrement {
  id: number;
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
  _count?: {
    stages: number;
  };
}

interface AgrementSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AgrementSelector({
  value,
  onValueChange,
  label = "Sélectionner un agrément",
  placeholder = "Choisir un agrément",
  required = false,
  disabled = false,
  className = ""
}: AgrementSelectorProps) {
  const [agrements, setAgrements] = useState<Agrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Charger la liste des agréments
  const loadAgrements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agrements');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();

      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setAgrements(data);
      } else {
        console.error('Format de données inattendu:', data);
        setAgrements([]);
        setError('Format de données inattendu');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setAgrements([]);
      console.error('Erreur lors du chargement des agréments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgrements();
  }, []);

  const handleAgrementAdded = async () => {
    await loadAgrements();
    setShowAddModal(false);
    toast.success("Agrément ajouté ! Vous pouvez maintenant le sélectionner.");
  };

  // CORRECTION: Trouver l'agrément sélectionné avec protection contre undefined
  const selectedAgrement = (agrements || []).find(a => a.id === Number(value));

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadAgrements}
            className="ml-auto text-red-600 border-red-300 hover:bg-red-50"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Select 
              value={value} 
              onValueChange={onValueChange}
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={loading ? "Chargement..." : placeholder} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="flex items-center gap-2 p-3 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Chargement des agréments...</span>
                  </div>
                ) : (agrements || []).length > 0 ? (
                  agrements.map((agrement) => (
                    <SelectItem key={agrement.id} value={agrement.id.toString()}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {agrement.departement}
                            {agrement.nomDepartement && (
                              <span className="text-gray-500 font-normal ml-1">
                                ({agrement.nomDepartement})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono">{agrement.numeroAgrement}</span>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun agrément disponible</p>
                    <p className="text-xs text-gray-400">Ajoutez-en un nouveau</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddModal(true)}
            disabled={disabled}
            className="h-12 px-3 border-gray-200 hover:bg-gray-50"
            title="Ajouter un nouvel agrément"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Affichage de l'agrément sélectionné */}
        {selectedAgrement && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Agrément sélectionné</span>
            </div>
            <div className="text-sm text-green-700">
              <div className="font-semibold">
                {selectedAgrement.departement}
                {selectedAgrement.nomDepartement && ` (${selectedAgrement.nomDepartement})`}
              </div>
              <div className="font-mono text-xs">
                N° {selectedAgrement.numeroAgrement}
              </div>
            </div>
          </div>
        )}

        {/* Info si pas d'agrément sélectionné */}
        {!loading && !selectedAgrement && !required && (
          <div className="text-xs text-gray-500">
            Optionnel - Laissez vide si aucun agrément spécifique n'est requis
          </div>
        )}
      </div>

      {/* Modal d'ajout d'agrément */}
      {showAddModal && (
        <AddAgrement
          onClose={() => setShowAddModal(false)}
          onAgrementAdded={handleAgrementAdded}
        />
      )}
    </>
  );
}