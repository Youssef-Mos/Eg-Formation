'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginModalResa from "../ui-reservation/loginredirect";
import EditStageModal from "../admin/EditStage";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Stage {
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
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
}

export default function ListeStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // Pagination state
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch("/api/Stage/RecupStage");
        if (!res.ok) throw new Error("Erreur de récupération");

        const data = await res.json();
        setStages(data);
      } catch (error) {
        console.error(error);
        toast.error("Erreur réseau");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();
  }, []);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/Stage/DeleteStage/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      setStages((prevStages) => prevStages.filter((stage) => stage.id !== id));
      toast.success("Stage supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error("Erreur lors de la suppression du stage");
    }
  };

  const handleReservation = (id: number) => {
    const targetUrl = `/reservation/${id}`;
    if (!session) {
      setCallbackUrl(targetUrl);
      setLoginOpen(true);
    } else {
      router.push(targetUrl);
    }
  };

  const handleOpenEdit = (stage: Stage) => {
    setEditingStage(stage);
    setEditModalOpen(true);
  };

  // Fonction de callback pour actualiser le stage après modification.
  const handleUpdateStage = (updatedStage: Stage) => {
    setStages((prevStages) =>
      prevStages.map((stage) => (stage.id === updatedStage.id ? updatedStage : stage))
    );
  };

  // Calculate pagination
  const totalPages = Math.ceil(stages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStages = stages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Liste des stages</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {paginatedStages.map((stage) => (
            <div
              key={stage.id}
              className="cursor-default border border-zinc-300 p-4 rounded-lg bg-zinc-50 hover:shadow-md hover:shadow-zinc-300 transition-all duration-200 ease-in hover:bg-zinc-100 hover:border-zinc-300 xl:w-lg"
            >
              <h2 className="text-xl font-semibold mb-2">{stage.Titre}</h2>
              <p className="mb-1">{stage.Adresse}</p>
              <p className="mb-1">
                {stage.CodePostal} {stage.Ville}
              </p>
              <p className="mb-1">Places disponibles: {stage.PlaceDisponibles}</p>
              <p className="mb-1">
                Du : {formatDate(stage.DateDebut)} de {stage.HeureDebut} à {stage.HeureFin} 
              </p>
              <p className="mb-1">
                Au : {formatDate(stage.DateFin)} de {stage.HeureDebut2} à {stage.HeureFin2}
              </p>
              <p className="text-lg font-bold mt-2">Prix: {stage.Prix}€</p>

              {session?.user?.role === "admin" ? (
                <div className="flex gap-2 justify-end mt-2">
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => handleDelete(stage.id)}
                  >
                    Supprimer
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={() => handleOpenEdit(stage)}
                  >
                    Modifier
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end mt-2">
                  <Button
                    className="cursor-pointer"
                    onClick={() => handleReservation(stage.id)}
                  >
                    Réserver
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-10 cursor-pointer">
          <PaginationPrevious
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          />
          <PaginationContent>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
          <PaginationNext
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          />
        </Pagination>
      )}

      <LoginModalResa
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        callbackUrl={callbackUrl}
      />

      <EditStageModal
        isOpen={isEditModalOpen}
        stage={editingStage}
        onClose={() => {
          setEditModalOpen(false);
          setEditingStage(null);
        }}
        onUpdate={handleUpdateStage}
      />
    </div>
  );
}