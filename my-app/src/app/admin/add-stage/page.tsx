'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DatePickerStageDébut  } from "@/components/admin/DatedébutStage";
import { DatePickerStageFin } from "@/components/admin/DatefinStage";

export default function AddStagePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    Titre: "",
    Adresse: "",
    CodePostal: "",
    Ville: "",
    PlaceDisponibles: "",
    DateDebut: new Date(),
    DateFin: new Date(),
    HeureDebut: "",
    HeureFin: "",
    Prix: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/Stage/AddStage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          PlaceDisponibles: Number(formData.PlaceDisponibles),
          Prix: Number(formData.Prix),
          // Conversion des dates si nécessaire
          DateDebut: new Date(formData.DateDebut),
          DateFin: new Date(formData.DateFin),
        }),
      });

      if (res.ok) {
        toast.success("Stage ajouté !");
        router.refresh(); 
        router.push("/"); // Redirige vers la page d'accueil ou une autre page
      } else {
        toast.error("Erreur lors de l'ajout du stage.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-zinc-100 -z-20">
    
    <div className="p-8 max-w-4xl my-15 border-2 rounded-lg flex flex-col w-sm xl:w-3xl bg-white hover:shadow-xl hover:shadow-zinc-400 transition-all duration-200 ease-in">
      <h1 className="text-2xl font-bold mb-6 flex justify-center">Ajouter un stage</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Titre *</span>
          <input
            type="text"
            name="Titre"
            placeholder="Titre du stage..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.Titre}
            onChange={(e) => setFormData({ ...formData, Titre: e.target.value })}
            required
          />
        </label>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Adresse *</span>
          <input
            type="text"
            name="Adresse"
            placeholder="Adresse..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.Adresse}
            onChange={(e) =>
              setFormData({ ...formData, Adresse: e.target.value })
            }
            required
          />
        </label>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Code Postal *</span>
          <input
            type="text"
            name="CodePostal"
            placeholder="Code postal..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.CodePostal}
            onChange={(e) =>
              setFormData({ ...formData, CodePostal: e.target.value })
            }
            required
          />
        </label>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Ville *</span>
          <input
            type="text"
            name="Ville"
            placeholder="Ville..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.Ville}
            onChange={(e) =>
              setFormData({ ...formData, Ville: e.target.value })
            }
            required
          />
        </label>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Places Disponibles *</span>
          <input
            type="number"
            name="PlaceDisponibles"
            placeholder="Nombre de places disponibles..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.PlaceDisponibles}
            onChange={(e) =>
              setFormData({ ...formData, PlaceDisponibles: e.target.value })
            }
            required
          />
        </label>

        <div className="flex justify-center">
            <DatePickerStageDébut onDateChange={(date) => setFormData({...formData, DateDebut: date})} />
        </div>

        <div className="flex justify-center">
            <DatePickerStageFin onDateChange={(date) => setFormData({...formData, DateFin: date})} />
        </div>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Heure de Début *</span>
          <input
            type="time"
            name="HeureDebut"
            placeholder="Heure de début..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.HeureDebut}
            onChange={(e) =>
              setFormData({ ...formData, HeureDebut: e.target.value })
            }
            required
          />
        </label>

        <label className="floating-label label  flex items-center  text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Heure de Fin *</span>
          <input
            type="time"
            name="HeureFin"
            placeholder="Heure de fin..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md flex items-center"
            value={formData.HeureFin}
            onChange={(e) =>
              setFormData({ ...formData, HeureFin: e.target.value })
            }
            required
          />
        </label>

        <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
          <span className="!bg-white">Prix *</span>
          <input
            type="number"
            step="10"
            name="Prix"
            placeholder="Prix..."
            className="bg-zinc-50 outline-0 text-zinc-900 input w-full  rounded-lg shadow-md"
            value={formData.Prix}
            onChange={(e) =>
              setFormData({ ...formData, Prix: e.target.value })
            }
            required
          />
        </label>

        <Button type="submit" className="cursor-pointer">Ajouter le stage</Button>
      </form>
    </div>
    </div>
  );
}
