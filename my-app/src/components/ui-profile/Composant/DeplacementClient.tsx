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
import { Loader2 } from "lucide-react";

interface DeplacementClientProps {
  user: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
  };
  fromStageId: number;
  stages: Array<{ id: number; Titre: string; PlaceDisponibles: number }>;
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
  
  // Filtrer les stages ayant des places disponibles et différents du stage actuel
  const availableStages = stages.filter(
    (s) => s.id !== fromStageId && s.PlaceDisponibles > 0
  );

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
          <div className="py-4">
            <Select value={targetStageId} onValueChange={setTargetStageId} disabled={loading || success}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un stage" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id.toString()}>
                    {stage.Titre} ({stage.PlaceDisponibles} places)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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