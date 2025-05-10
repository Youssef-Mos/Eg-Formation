"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";

interface Reservation {
  id: number;
  stage: {
    id: number;
    Titre: string;
    DateDebut: string;
    DateFin: string;
    HeureDebut: string;
    HeureFin: string;
    Prix: number;
  };
  createdAt: string;
}

export default function MesReservations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(reservations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = reservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchReservations();
    }
  }, [status]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservationuser", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(res);
      if (!res.ok) throw new Error("Erreur chargement réservations");
      const data: Reservation[] = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger vos réservations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Mes Réservations</h1>
        <p className="text-gray-600">Aucune réservation trouvée.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Mes Réservations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((r) => (
          <div key={r.id} className="border p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{r.stage.Titre}</h2>
            <p className="mb-1">
              Dates: {new Date(r.stage.DateDebut).toLocaleDateString("fr-FR")} — {new Date(r.stage.DateFin).toLocaleDateString("fr-FR")}
            </p>
            <p className="mb-1">
              Horaires: {r.stage.HeureDebut} — {r.stage.HeureFin}
            </p>
            <p className="mb-2 text-lg font-bold">Prix: {r.stage.Prix}€</p>
            <Button variant="outline" onClick={() => router.push(`/stage/${r.stage.id}`)}>
              Voir le stage
            </Button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} />
          <PaginationContent>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <PaginationItem key={num}>
                <PaginationLink isActive={num === currentPage} onClick={() => setCurrentPage(num)}>
                  {num}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
          <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} />
        </Pagination>
      )}
    </div>
  );
}