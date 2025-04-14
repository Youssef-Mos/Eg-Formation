'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "../ui/button";
import { toast } from "sonner";

export interface Stage {
  id: number;
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: Date;
  DateFin: Date;
  HeureDebut: string;
  HeureFin: string;
  Prix: number;
  // Ajoutez d'autres propriétés si nécessaire
}

interface EditStageModalProps {
  isOpen: boolean;
  stage: Stage | null;
  onClose: () => void;
  onUpdate: (updatedStage: Stage) => void;
}

export default function EditStageModal({ isOpen, stage, onClose, onUpdate }: EditStageModalProps) {
  const [newTitre, setNewTitre] = useState("");
  const [newAdresse, setNewAdresse] = useState("");
  const [newPrix, setNewPrix] = useState(0);

  // Lorsque le stage à modifier change, pré-remplir le formulaire.
  useEffect(() => {
    if (stage) {
      setNewTitre(stage.Titre);
      setNewAdresse(stage.Adresse);
      setNewPrix(stage.Prix);
    }
  }, [stage]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stage) return;

    try {
      const res = await fetch(`/api/Stage/UpdateStage/${stage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Titre: newTitre,
          Adresse: newAdresse,
          Prix: newPrix,
          // Vous pouvez ajouter d'autres champs à mettre à jour ici.
        }),
      });

      if (!res.ok) {
        throw new Error("Échec de la mise à jour");
      }

      const updatedStage = await res.json();

      toast.success("Stage mis à jour avec succès");
      onUpdate(updatedStage);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      toast.error("Erreur lors de la mise à jour du stage");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && stage && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg bg-zinc-800 text-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Bouton de fermeture */}
            <button className="absolute top-4 right-4 text-white cursor-pointer" onClick={onClose}>
              <X size={24} />
            </button>

            <h1 className="text-2xl text-center mt-3 mb-6">Modifier le stage</h1>

            <form onSubmit={handleUpdate}>
              <Label className="block mb-2" htmlFor="titre">
                Titre
              </Label>
              <Input
                type="text"
                id="titre"
                value={newTitre}
                onChange={(e) => setNewTitre(e.target.value)}
                className="w-full mb-4"
              />

              <Label className="block mb-2" htmlFor="adresse">
                Adresse
              </Label>
              <Input
                type="text"
                id="adresse"
                value={newAdresse}
                onChange={(e) => setNewAdresse(e.target.value)}
                className="w-full mb-4"
              />

              <Label className="block mb-2" htmlFor="prix">
                Prix (€)
              </Label>
              <Input
                type="number"
                id="prix"
                value={newPrix}
                onChange={(e) => setNewPrix(Number(e.target.value))}
                className="w-full mb-4"
              />

              <Button variant="default" type="submit" className="w-full mt-4">
                Mettre à jour
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
