'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Shield, 
  MapPin, 
  Hash,
  Save,
  X
} from "lucide-react";
import { motion } from "framer-motion";

interface AddAgrementProps {
  onClose: () => void;
  onAgrementAdded: () => void; // Callback pour rafraîchir la liste
}

interface AgrementFormData {
  departement: string;
  numeroAgrement: string;
  nomDepartement: string;
}

export default function AddAgrement({ onClose, onAgrementAdded }: AddAgrementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AgrementFormData>({
    departement: "",
    numeroAgrement: "",
    nomDepartement: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/agrements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departement: formData.departement,
          numeroAgrement: formData.numeroAgrement,
          nomDepartement: formData.nomDepartement || undefined,
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success("Agrément ajouté avec succès !");
        onAgrementAdded(); // Rafraîchir la liste des agréments
        onClose(); // Fermer le modal
      } else {
        toast.error(responseData.message || "Erreur lors de l'ajout de l'agrément.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau lors de l'ajout de l'agrément.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AgrementFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Ajouter un agrément</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section: Informations de l'agrément */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <Hash className="w-4 h-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Informations de l'agrément</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Département */}
              <div className="space-y-2">
                <Label htmlFor="departement" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Département *
                </Label>
                <Input
                  id="departement"
                  type="text"
                  placeholder="Ex: 59, Nord, etc."
                  value={formData.departement}
                  onChange={(e) => handleInputChange("departement", e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Numéro d'agrément */}
              <div className="space-y-2">
                <Label htmlFor="numeroAgrement" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Numéro d'agrément *
                </Label>
                <Input
                  id="numeroAgrement"
                  type="text"
                  placeholder="Ex: R2305900010"
                  value={formData.numeroAgrement}
                  onChange={(e) => handleInputChange("numeroAgrement", e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Nom complet du département (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="nomDepartement" className="text-sm font-medium text-gray-700">
                Nom complet du département (optionnel)
              </Label>
              <Input
                id="nomDepartement"
                type="text"
                placeholder="Ex: Nord, Pas-de-Calais, etc."
                value={formData.nomDepartement}
                onChange={(e) => handleInputChange("nomDepartement", e.target.value)}
                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2 h-11 border-gray-300 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none sm:min-w-40 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Ajout...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Ajouter l'agrément
                </div>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}