'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginModalResa from "../ui-reservation/loginredirect";
import EditStageModal from "../admin/EditStage";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Euro, 
  Hash,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
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
  NumeroStage: number;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
}

interface FilterValues {
  ville: string;
  departement: string;
  date: Date | null;
  motsCles: string;
}

interface ListeStagesProps {
  filters: FilterValues;
}

export default function ListeStages({ filters }: ListeStagesProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

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
    return date.toLocaleDateString("fr-FR");
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/Stage/DeleteStage/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      setStages((prev) => prev.filter((stage) => stage.id !== id));
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

  const handleUpdateStage = (updatedStage: Stage) => {
    setStages((prev) =>
      prev.map((stage) => (stage.id === updatedStage.id ? updatedStage : stage))
    );
  };

  // Filtrage avant pagination
  const filteredStages = stages.filter((stage) => {
    const matchVille =
      !filters.ville ||
      stage.Ville?.toLowerCase().includes(filters.ville.toLowerCase());

    const matchDepartement =
      !filters.departement ||
      stage.CodePostal.startsWith(filters.departement);

    const matchMotsCles =
      !filters.motsCles ||
      stage.Titre?.toLowerCase().includes(filters.motsCles.toLowerCase());

    const matchDate =
      !filters.date ||
      new Date(stage.DateDebut).toDateString() === new Date(filters.date).toDateString();

    return matchVille && matchDepartement && matchMotsCles && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStages = filteredStages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header moderne */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
          Catalogue des Stages
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {filteredStages.length > 0 
            ? `${filteredStages.length} stage(s) disponible(s)`
            : "Aucun stage trouvé"
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Chargement des stages...</p>
        </div>
      ) : filteredStages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">Aucun stage trouvé</p>
          <p className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <>
          {/* Grille des stages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {paginatedStages.map((stage) => (
              <div
                key={stage.id}
                className="group bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 ease-in-out hover:-translate-y-1"
              >
                {/* Header de la carte */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {stage.Titre}
                  </h2>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full flex-shrink-0">
                    <Hash className="w-3 h-3" />
                    {stage.NumeroStage}
                  </div>
                </div>

                {/* Informations principales */}
                <div className="space-y-3 mb-6">
                  {/* Localisation */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600 min-w-0">
                      <p className="truncate">{stage.Adresse}</p>
                      <p className="font-medium">{stage.CodePostal} {stage.Ville}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="text-sm text-gray-600 min-w-0">
                      <span className="block sm:inline">
                        Du {formatDate(stage.DateDebut)}
                      </span>
                      <span className="block sm:inline sm:ml-1">
                        au {formatDate(stage.DateFin)}
                      </span>
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600 min-w-0">
                      <p>{stage.HeureDebut} - {stage.HeureFin}</p>
                      <p>{stage.HeureDebut2} - {stage.HeureFin2}</p>
                    </div>
                  </div>

                  {/* Places disponibles */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {stage.PlaceDisponibles} places disponibles
                    </span>
                  </div>
                </div>

                {/* Footer de la carte */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                  {/* Prix */}
                  <div className="flex items-center gap-1">
                    <Euro className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-gray-800">{stage.Prix}€</span>
                  </div>

                  {/* Boutons d'action */}
                  {session?.user?.role === "admin" ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 sm:flex-none cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => handleDelete(stage.id)}
                      >
                        Supprimer
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none cursor-pointer hover:scale-105 transition-transform duration-200 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleOpenEdit(stage)}
                      >
                        Modifier
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto cursor-pointer hover:scale-105 transition-transform duration-200 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25"
                      onClick={() => handleReservation(stage.id)}
                    >
                      Réserver maintenant
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination modernisée */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 cursor-pointer ${
                          pageNum === currentPage 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="flex items-center gap-1 hover:bg-blue-50 cursor-pointer hover:border-blue-300"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </p>
            </div>
          )}
        </>
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