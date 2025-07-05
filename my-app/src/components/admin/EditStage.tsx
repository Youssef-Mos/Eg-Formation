'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Save, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  Clock, 
  Euro, 
  Users,
  Eye,
  AlertCircle,
  CheckCircle2,
  Hash
} from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Calendar as CalendarComponent } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Stage {
  id: number;
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: Date;
  DateFin: Date;
  NumeroStage: number;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  createdAt: Date; // Ajout pour compatibilité TypeScript
  hidden: boolean; // ✅ AJOUTER ce champ
  updatedAt: Date; // ✅ NOUVEAU CHAMP
}

interface EditStageModalProps {
  isOpen: boolean;
  stage: Stage | null;
  onClose: () => void;
  onUpdate: (updatedStage: Stage) => void;
}

export default function EditStageModal({ isOpen, stage, onClose, onUpdate }: EditStageModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour tous les champs modifiables
  const [formData, setFormData] = useState({
    Titre: "",
    Adresse: "",
    CodePostal: "",
    Ville: "",
    PlaceDisponibles: 0,
    DateDebut: new Date(),
    DateFin: new Date(),
    HeureDebut: "",
    HeureFin: "",
    HeureDebut2: "",
    HeureFin2: "",
    Prix: 0,
  });

  // Données originales pour comparaison
  const [originalData, setOriginalData] = useState<Partial<Stage>>({});

  // Pré-remplir le formulaire quand le stage change
  useEffect(() => {
    if (stage) {
      const data = {
        Titre: stage.Titre,
        Adresse: stage.Adresse,
        CodePostal: stage.CodePostal,
        Ville: stage.Ville,
        PlaceDisponibles: stage.PlaceDisponibles,
        DateDebut: new Date(stage.DateDebut),
        DateFin: new Date(stage.DateFin),
        HeureDebut: stage.HeureDebut,
        HeureFin: stage.HeureFin,
        HeureDebut2: stage.HeureDebut2,
        HeureFin2: stage.HeureFin2,
        Prix: stage.Prix,
      };
      setFormData(data);
      setOriginalData(stage);
    }
  }, [stage]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    if (stage) {
      setFormData({
        Titre: stage.Titre,
        Adresse: stage.Adresse,
        CodePostal: stage.CodePostal,
        Ville: stage.Ville,
        PlaceDisponibles: stage.PlaceDisponibles,
        DateDebut: new Date(stage.DateDebut),
        DateFin: new Date(stage.DateFin),
        HeureDebut: stage.HeureDebut,
        HeureFin: stage.HeureFin,
        HeureDebut2: stage.HeureDebut2,
        HeureFin2: stage.HeureFin2,
        Prix: stage.Prix,
      });
      setShowPreview(false);
      toast.info("Modifications annulées");
    }
  };

  const handleClose = () => {
    setShowPreview(false);
    setActiveTab("info");
    onClose();
  };

  const hasChanges = () => {
    if (!stage) return false;
    return (
      formData.Titre !== stage.Titre ||
      formData.Adresse !== stage.Adresse ||
      formData.CodePostal !== stage.CodePostal ||
      formData.Ville !== stage.Ville ||
      formData.PlaceDisponibles !== stage.PlaceDisponibles ||
      formData.DateDebut.getTime() !== new Date(stage.DateDebut).getTime() ||
      formData.DateFin.getTime() !== new Date(stage.DateFin).getTime() ||
      formData.HeureDebut !== stage.HeureDebut ||
      formData.HeureFin !== stage.HeureFin ||
      formData.HeureDebut2 !== stage.HeureDebut2 ||
      formData.HeureFin2 !== stage.HeureFin2 ||
      formData.Prix !== stage.Prix
    );
  };

  const validateForm = () => {
    if (!formData.Titre.trim()) {
      toast.error("Le titre est requis");
      return false;
    }
    if (!formData.Adresse.trim()) {
      toast.error("L'adresse est requise");
      return false;
    }
    if (!formData.CodePostal.trim() || formData.CodePostal.length !== 5) {
      toast.error("Le code postal doit contenir 5 chiffres");
      return false;
    }
    if (!formData.Ville.trim()) {
      toast.error("La ville est requise");
      return false;
    }
    if (formData.PlaceDisponibles < 0) {
      toast.error("Le nombre de places doit être positif");
      return false;
    }
    if (formData.Prix <= 0) {
      toast.error("Le prix doit être supérieur à 0");
      return false;
    }
    if (formData.DateDebut >= formData.DateFin) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!stage || !validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/Stage/UpdateStage/${stage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Échec de la mise à jour");
      }

      const updatedStage = await res.json();
      
      // Ajouter createdAt pour maintenir la compatibilité
      const stageWithCreatedAt = {
        ...updatedStage,
        createdAt: stage.createdAt // Conserver la date de création originale
      };
      
      toast.success("Stage mis à jour avec succès !");
      onUpdate(stageWithCreatedAt);
      handleClose();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour :", error);
      toast.error(error.message || "Erreur lors de la mise à jour du stage");
    } finally {
      setIsLoading(false);
    }
  };

  const ComparisonField = ({ label, original, current, icon: Icon }: {
    label: string;
    original: any;
    current: any;
    icon: any;
  }) => {
    const hasChanged = original !== current;
    return (
      <div className={`p-3 rounded-lg border transition-all duration-200 ${hasChanged ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{label}</span>
          {hasChanged && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Avant</p>
            <p className="text-gray-800 bg-white p-2 rounded border break-words">{String(original)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Après</p>
            <p className={`p-2 rounded border font-medium break-words ${hasChanged ? 'text-blue-800 bg-blue-100 border-blue-200' : 'text-gray-800 bg-white'}`}>
              {String(current)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!stage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          
        >
          <motion.div
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <button 
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200 z-20 cursor-pointer" 
                onClick={handleClose}
              >
                <X size={20} />
              </button>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Hash className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold">Modifier le stage</h1>
                    <p className="text-blue-100 text-sm sm:text-base truncate">#{stage.NumeroStage} - {stage.Titre}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs value={showPreview ? "preview" : activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                  <TabsList className="grid w-full grid-cols-4 gap-1 sm:gap-2">
                    <TabsTrigger value="info" className="cursor-pointer flex items-center justify-center gap-1 px-1 sm:px-2 text-xs sm:text-sm">
                      <Hash className="w-4 h-4" />
                      <span className="hidden sm:inline">Informations</span>
                    </TabsTrigger>
                    <TabsTrigger value="location" className="cursor-pointer flex items-center justify-center gap-1 px-1 sm:px-2 text-xs sm:text-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">Localisation</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="cursor-pointer flex items-center justify-center gap-1 px-1 sm:px-2 text-xs sm:text-sm">
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Planning</span>
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="cursor-pointer flex items-center justify-center gap-1 px-1 sm:px-2 text-xs sm:text-sm" disabled={!hasChanges()}>
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Aperçu</span>
                      {hasChanges() && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-3 sm:p-6">
                  {/* Onglet Informations */}
                  <TabsContent value="info" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="titre">Titre du stage</Label>
                        <Input
                          id="titre"
                          value={formData.Titre}
                          onChange={(e) => handleInputChange("Titre", e.target.value)}
                          placeholder="Titre du stage"
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prix">Prix (€)</Label>
                        <Input
                          id="prix"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.Prix}
                          onChange={(e) => handleInputChange("Prix", Number(e.target.value))}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="places">Places restantes sur {stage.PlaceDisponibles}</Label>
                        <Input
                          id="places"
                          type="number"
                          min="0"
                          value={formData.PlaceDisponibles}
                          onChange={(e) => handleInputChange("PlaceDisponibles", Number(e.target.value))}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Numéro de stage</Label>
                        <Input
                          value={stage.NumeroStage}
                          disabled
                          className="h-10 sm:h-12 bg-gray-100 text-gray-500"
                        />
                        <p className="text-xs text-gray-500">Non modifiable</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Onglet Localisation */}
                  <TabsContent value="location" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input
                          id="adresse"
                          value={formData.Adresse}
                          onChange={(e) => handleInputChange("Adresse", e.target.value)}
                          placeholder="Adresse complète"
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codePostal">Code postal</Label>
                        <Input
                          id="codePostal"
                          value={formData.CodePostal}
                          onChange={(e) => handleInputChange("CodePostal", e.target.value)}
                          placeholder="00000"
                          maxLength={5}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ville">Ville</Label>
                        <Input
                          id="ville"
                          value={formData.Ville}
                          onChange={(e) => handleInputChange("Ville", e.target.value)}
                          placeholder="Ville"
                          className="h-10 sm:h-12"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Onglet Planning */}
                  <TabsContent value="schedule" className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Dates */}
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-10 sm:h-12 justify-start text-left font-normal",
                                !formData.DateDebut && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              <span className="truncate">
                                {formData.DateDebut ? (
                                  format(formData.DateDebut, "PPP", { locale: fr })
                                ) : (
                                  "Sélectionnez une date"
                                )}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={formData.DateDebut}
                              onSelect={(date) => date && handleInputChange("DateDebut", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-10 sm:h-12 justify-start text-left font-normal",
                                !formData.DateFin && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              <span className="truncate">
                                {formData.DateFin ? (
                                  format(formData.DateFin, "PPP", { locale: fr })
                                ) : (
                                  "Sélectionnez une date"
                                )}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={formData.DateFin}
                              onSelect={(date) => date && handleInputChange("DateFin", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Horaires Jour 1 */}
                      <div className="space-y-2">
                        <Label htmlFor="heureDebut">Heure début matinée</Label>
                        <Input
                          id="heureDebut"
                          type="time"
                          value={formData.HeureDebut}
                          onChange={(e) => handleInputChange("HeureDebut", e.target.value)}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heureFin">Heure fin matinée</Label>
                        <Input
                          id="heureFin"
                          type="time"
                          value={formData.HeureFin}
                          onChange={(e) => handleInputChange("HeureFin", e.target.value)}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      {/* Horaires Jour 2 */}
                      <div className="space-y-2">
                        <Label htmlFor="heureDebut2">Heure début après-midi</Label>
                        <Input
                          id="heureDebut2"
                          type="time"
                          value={formData.HeureDebut2}
                          onChange={(e) => handleInputChange("HeureDebut2", e.target.value)}
                          className="h-10 sm:h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heureFin2">Heure fin après-midi</Label>
                        <Input
                          id="heureFin2"
                          type="time"
                          value={formData.HeureFin2}
                          onChange={(e) => handleInputChange("HeureFin2", e.target.value)}
                          className="h-10 sm:h-12"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Onglet Aperçu */}
                  <TabsContent value="preview" className="space-y-4 sm:space-y-6">
                    {hasChanges() ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Aperçu des modifications</h3>
                          </div>
                          <p className="text-blue-700 text-xs sm:text-sm mt-1">
                            Vérifiez les changements avant de confirmer la mise à jour.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:gap-4">
                          <ComparisonField
                            label="Titre"
                            original={originalData.Titre}
                            current={formData.Titre}
                            icon={Hash}
                          />
                          
                          <ComparisonField
                            label="Adresse"
                            original={`${originalData.Adresse}, ${originalData.CodePostal} ${originalData.Ville}`}
                            current={`${formData.Adresse}, ${formData.CodePostal} ${formData.Ville}`}
                            icon={MapPin}
                          />
                          
                          <ComparisonField
                            label="Prix"
                            original={`${originalData.Prix}€`}
                            current={`${formData.Prix}€`}
                            icon={Euro}
                          />
                          
                          <ComparisonField
                            label="Places disponibles"
                            original={originalData.PlaceDisponibles}
                            current={formData.PlaceDisponibles}
                            icon={Users}
                          />
                          
                          <ComparisonField
                            label="Dates"
                            original={
                              originalData.DateDebut && originalData.DateFin
                                ? `${format(new Date(originalData.DateDebut), "PPP", { locale: fr })} - ${format(new Date(originalData.DateFin), "PPP", { locale: fr })}`
                                : "Date non définie"
                            }
                            current={
                              formData.DateDebut && formData.DateFin
                                ? `${format(formData.DateDebut, "PPP", { locale: fr })} - ${format(formData.DateFin, "PPP", { locale: fr })}`
                                : "Date non définie"
                            }
                            icon={Calendar}
                          />

                          
                          <ComparisonField
                            label="Horaires"
                            original={`Matin: ${originalData.HeureDebut}-${originalData.HeureFin} | Aprem: ${originalData.HeureDebut2}-${originalData.HeureFin2}`}
                            current={`Matin: ${formData.HeureDebut}-${formData.HeureFin} | Aprem: ${formData.HeureDebut2}-${formData.HeureFin2}`}
                            icon={Clock}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">Aucune modification détectée</p>
                        <p className="text-gray-400 text-xs sm:text-sm">Modifiez les informations dans les onglets précédents</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges() || isLoading}
                  className="cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Annuler les modifications</span>
                  <span className="sm:hidden">Annuler</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="cursor-pointer text-xs sm:text-sm h-9 sm:h-10"
                >
                  Fermer
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges() || isLoading}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-xs sm:text-sm h-9 sm:h-10"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Sauvegarde...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Sauvegarder les modifications</span>
                      <span className="sm:hidden">Sauvegarder</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}