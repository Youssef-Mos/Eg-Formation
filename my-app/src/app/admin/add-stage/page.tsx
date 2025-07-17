'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DatePickerStageDébut } from "@/components/admin/DatedébutStage";
import { DatePickerStageFin } from "@/components/admin/DatefinStage";
import AgrementSelector from "@/components/admin/AgrementSelector";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Euro, 
  Hash,
  Plus,
  Save,
  ArrowLeft,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import AuthGuard from "@/components/auth/AuthGuard";

// ✅ FONCTION UTILITAIRE pour convertir Date en string YYYY-MM-DD
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddStagePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    Titre: "",
    Adresse: "",
    CodePostal: "",
    Ville: "",
    PlaceDisponibles: "",
    NumeroStage: "",
    DateDebut: new Date(),
    DateFin: new Date(),
    HeureDebut: "",
    HeureFin: "",
    HeureDebut2: "",
    HeureFin2: "",
    Prix: "",
    agrementId: "", // Nouveau champ pour l'agrément sélectionné
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // ✅ CORRECTION PRINCIPALE: Envoyer les dates au format string YYYY-MM-DD
      const res = await fetch("/api/Stage/AddStage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          PlaceDisponibles: Number(formData.PlaceDisponibles),
          NumeroStage: String(formData.NumeroStage),
          Prix: Number(formData.Prix),
          // ✅ Conversion des dates en string format YYYY-MM-DD
          DateDebut: formatDateForApi(formData.DateDebut),
          DateFin: formatDateForApi(formData.DateFin),
          agrementId: formData.agrementId ? Number(formData.agrementId) : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Stage ajouté avec succès !");
        router.refresh();
        router.push("/");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors de l'ajout du stage.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau lors de l'ajout du stage.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Créer un nouveau stage</h1>
            </div>
            <p className="text-gray-600">Remplissez les informations ci-dessous pour ajouter un nouveau stage</p>
          </motion.div>

          {/* Formulaire */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              
              {/* Section 1: Informations générales */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <Hash className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Informations générales</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Titre */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="titre" className="text-sm font-medium text-gray-700">
                      Titre du stage *
                    </Label>
                    <Input
                      id="titre"
                      type="text"
                      placeholder="Ex: Formation sécurité routière..."
                      value={formData.Titre}
                      onChange={(e) => handleInputChange("Titre", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Numéro de stage */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroStage" className="text-sm font-medium text-gray-700">
                      Numéro d'identification *
                    </Label>
                    <Input
                      id="numeroStage"
                      type="text"
                      placeholder="Ex: 202NY5001"
                      value={formData.NumeroStage}
                      onChange={(e) => handleInputChange("NumeroStage", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Places disponibles */}
                  <div className="space-y-2">
                    <Label htmlFor="places" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Places disponibles *
                    </Label>
                    <Input
                      id="places"
                      type="number"
                      min="1"
                      placeholder="Ex: 20"
                      value={formData.PlaceDisponibles}
                      onChange={(e) => handleInputChange("PlaceDisponibles", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section Agrément */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Agrément</h2>
                </div>
                
                <AgrementSelector
                  value={formData.agrementId}
                  onValueChange={(value) => handleInputChange("agrementId", value)}
                  label="Sélectionner un agrément (optionnel)"
                  placeholder="Choisir un agrément"
                />
              </div>

              {/* Section 2: Localisation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Localisation</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Adresse */}
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">
                      Adresse *
                    </Label>
                    <Input
                      id="adresse"
                      type="text"
                      placeholder="Ex: 123 Rue de la Formation..."
                      value={formData.Adresse}
                      onChange={(e) => handleInputChange("Adresse", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Code postal */}
                  <div className="space-y-2">
                    <Label htmlFor="codePostal" className="text-sm font-medium text-gray-700">
                      Code postal *
                    </Label>
                    <Input
                      id="codePostal"
                      type="text"
                      placeholder="Ex: 59000"
                      value={formData.CodePostal}
                      onChange={(e) => handleInputChange("CodePostal", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Ville */}
                  <div className="md:col-start-2 lg:col-start-auto space-y-2">
                    <Label htmlFor="ville" className="text-sm font-medium text-gray-700">
                      Ville *
                    </Label>
                    <Input
                      id="ville"
                      type="text"
                      placeholder="Ex: Lille"
                      value={formData.Ville}
                      onChange={(e) => handleInputChange("Ville", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Dates et horaires */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Dates et horaires</h2>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date de début *</Label>
                    <DatePickerStageDébut 
                      onDateChange={(date) => setFormData({...formData, DateDebut: date || new Date()})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date de fin *</Label>
                    <DatePickerStageFin 
                      onDateChange={(date) => setFormData({...formData, DateFin: date || new Date()})} 
                    />
                  </div>
                </div>

                {/* Horaires jour 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <h3 className="text-lg font-medium text-gray-700">Heure matinée</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heureDebut1" className="text-sm font-medium text-gray-700">
                        Heure de début *
                      </Label>
                      <Input
                        id="heureDebut1"
                        type="time"
                        value={formData.HeureDebut}
                        onChange={(e) => handleInputChange("HeureDebut", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureFin1" className="text-sm font-medium text-gray-700">
                        Heure de fin *
                      </Label>
                      <Input
                        id="heureFin1"
                        type="time"
                        value={formData.HeureFin}
                        onChange={(e) => handleInputChange("HeureFin", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Horaires jour 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <h3 className="text-lg font-medium text-gray-700">Heure après-midi</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heureDebut2" className="text-sm font-medium text-gray-700">
                        Heure de début *
                      </Label>
                      <Input
                        id="heureDebut2"
                        type="time"
                        value={formData.HeureDebut2}
                        onChange={(e) => handleInputChange("HeureDebut2", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureFin2" className="text-sm font-medium text-gray-700">
                        Heure de fin *
                      </Label>
                      <Input
                        id="heureFin2"
                        type="time"
                        value={formData.HeureFin2}
                        onChange={(e) => handleInputChange("HeureFin2", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Prix */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                  <Euro className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Tarification</h2>
                </div>
                
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="prix" className="text-sm font-medium text-gray-700">
                    Prix du stage (€) *
                  </Label>
                  <Input
                    id="prix"
                    type="number"
                    step="10"
                    min="0"
                    placeholder="Ex: 250"
                    value={formData.Prix}
                    onChange={(e) => handleInputChange("Prix", e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 h-12 border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 sm:flex-none sm:min-w-48 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Création en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Créer le stage
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}