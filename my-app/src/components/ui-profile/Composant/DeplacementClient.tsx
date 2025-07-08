// components/Composant/DeplacementClient.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, MapPin } from "lucide-react";

interface DeplacementClientProps {
  user: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
  };
  fromStageId: number;
  stages: Array<{ 
    id: number; 
    Titre: string; 
    PlaceDisponibles: number;
    DateDebut: Date;
    DateFin: Date;
    Ville: string;
    CodePostal: string;
  }>;
  refresh: () => void;
  setGlobalLoading?: (loading: boolean) => void;
}

export function DeplacementClient({
  user,
  fromStageId,
  stages,
  refresh,
  setGlobalLoading,
}: DeplacementClientProps) {
  const [targetStageId, setTargetStageId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // ✅ Fonction pour formater les dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // ✅ Fonction pour formater la période complète
  const formatDateRange = (dateDebut: Date, dateFin: Date) => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    
    // Si c'est le même jour
    if (debut.toDateString() === fin.toDateString()) {
      return formatDate(debut);
    }
    
    // Si c'est le même mois
    if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
      return `${debut.getDate()} - ${fin.getDate()} ${debut.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
    }
    
    // Sinon affichage complet
    return `${formatDate(debut)} - ${formatDate(fin)}`;
  };

  // ✅ Filtrer et trier les stages par date
  const availableStages = stages
    .filter((s) => s.id !== fromStageId && s.PlaceDisponibles > 0)
    .sort((a, b) => new Date(a.DateDebut).getTime() - new Date(b.DateDebut).getTime());

  const handleMove = async () => {
    if (!targetStageId) {
      toast.error("Veuillez sélectionner un stage de destination");
      return;
    }

    setLoading(true);
    
    try {
      if (setGlobalLoading) setGlobalLoading(true);
      
      const response = await fetch("/api/Stage/DeplacerReservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          fromStageId,
          toStageId: parseInt(targetStageId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec du déplacement");
      }

      toast.success(`${user.prenom} ${user.nom} a été déplacé avec succès`);
      setSuccess(true);
      
      // Attendre un peu avant de fermer le dialogue pour montrer le succès
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        refresh(); // Rafraîchir les données
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du déplacement");
    } finally {
      if (setGlobalLoading) setGlobalLoading(false);
      setLoading(false);
    }
  };

  // ✅ Trouver le stage sélectionné pour afficher ses détails
  const selectedStage = availableStages.find(stage => stage.id.toString() === targetStageId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Déplacer vers un autre stage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Déplacer {user.prenom} {user.nom}</DialogTitle>
          <DialogDescription>
            Sélectionnez un stage disponible pour y déplacer ce participant. Un email de notification sera envoyé au client.
          </DialogDescription>
        </DialogHeader>
        
        {availableStages.length === 0 ? (
          <div className="py-4 text-center text-amber-600">
            Aucun stage disponible pour le déplacement.
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <Select value={targetStageId} onValueChange={setTargetStageId} disabled={loading || success}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un stage par date" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id.toString()}>
                    <div className="flex flex-col items-start py-1">
                      {/* ✅ Date en principal */}
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{formatDateRange(stage.DateDebut, stage.DateFin)}</span>
                      </div>
                      
                      {/* ✅ Informations complémentaires */}
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{stage.Ville} ({stage.CodePostal})</span>
                        </div>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                          {stage.PlaceDisponibles} place{stage.PlaceDisponibles > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* ✅ Titre en petit */}
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-full">
                        {stage.Titre}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ✅ Aperçu du stage sélectionné */}
            {selectedStage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium text-blue-800 mb-2">Détails du stage sélectionné :</div>
                  <div className="space-y-1 text-blue-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateRange(selectedStage.DateDebut, selectedStage.DateFin)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedStage.Ville} ({selectedStage.CodePostal})</span>
                    </div>
                    <div className="text-xs mt-2 text-blue-600">
                      📋 {selectedStage.Titre}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!targetStageId || loading || success || availableStages.length === 0}
            className={success ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Déplacement...
              </>
            ) : success ? (
              "Déplacement réussi ✓"
            ) : (
              "Déplacer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}