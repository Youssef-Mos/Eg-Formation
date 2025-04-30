"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  PlaceDisponibles: number;
}

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export default function HistoriqueResa() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Pagination state
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: session } = useSession();
  const router = useRouter();

  // Fetch all stages
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch('/api/Stage/RecupStage');
        if (!res.ok) throw new Error('Erreur récupération des stages');
        const data: Stage[] = await res.json();
        setStages(data);
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les stages');
      } finally {
        setLoadingStages(false);
      }
    };
    fetchStages();
  }, []);

  // Fetch profiles for a given stage
  const loadProfiles = async (stageId: number) => {
    setLoadingProfiles(true);
    try {
      // On interroge maintenant la route qui renvoie le stage + ses réservations
      const res = await fetch(`/api/Stage/RecupByStage/${stageId}`);
      if (!res.ok) throw new Error('Erreur récupération des données du stage');
      
      const stageWithReservations = await res.json();
  
      // On récupère juste les objets "user" de chaque réservation
      const users: UserProfile[] = Array.isArray(stageWithReservations.reservations)
        ? stageWithReservations.reservations.map((r: any) => ({
            id: r.user.id,
            prenom: r.user.firstName,
            nom:    r.user.lastName,
            email:  r.user.email,
          }))
        : [];
  
      setProfiles(users);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les profils');
    } finally {
      setLoadingProfiles(false);
    }
  };
  // Pagination calculations
  const totalPages = Math.ceil(stages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStages = stages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Historique des Réservations</h1>

      {loadingStages ? (
        <div className="flex justify-center items-center h-40">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedStages.map(stage => (
              <div key={stage.id} className="border p-4 rounded-lg bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-2">{stage.Titre}</h2>
                <p className="mb-2">Places restantes: {stage.PlaceDisponibles}</p>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedStage === stage.id) {
                        setSelectedStage(null);
                        setProfiles([]);
                      } else {
                        setSelectedStage(stage.id);
                        loadProfiles(stage.id);
                      }
                    }}
                  >
                    {selectedStage === stage.id ? 'Masquer profils' : 'Voir profils'}
                  </Button>
                </div>

                {selectedStage === stage.id && (
                  <div className="mt-4">
                    {loadingProfiles ? (
                      <span className="loading loading-spinner loading-md"></span>
                    ) : profiles.length > 0 ? (
                      <ul className="space-y-2">
                        {profiles.map(p => (
                          <li key={p.id} className="border p-2 rounded">
                            {p.prenom} {p.nom} (<a href={`mailto:${p.email}`} className="text-blue-500 underline">{p.email}</a>)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">Aucune réservation pour ce stage.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} />
              <PaginationContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
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
              <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
