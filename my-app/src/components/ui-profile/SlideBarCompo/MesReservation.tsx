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
import { CreditCard, AlertCircle, CheckCircle, X, Trash2 } from "lucide-react";

interface Reservation {
  id: number;
  stage: {
    id: number;
    Titre: string;
    DateDebut: string;
    DateFin: string;
    HeureDebut: string;
    HeureFin: string;
    HeureDebut2: string;
    HeureFin2: string;
    Prix: number;
  };
  createdAt: string;
  // Ajout des nouveaux champs
  paymentMethod?: string;
  paid?: boolean;
  TypeStage: string;
}

const formatTypeStage = (type: string): string => {
  const types: Record<string, string> = {
    "recuperation_points": "Récupération des points",
    "permis_probatoire": "Permis probatoire (lettre Réf. 48N)",
    "alternative_poursuites": "Alternative aux poursuites pénales",
    "peine_complementaire": "Peine complémentaire",
    "stage": "Stage standard"
  };
  
  return types[type] || type;
};

const formatPaymentMethod = (method: string | undefined): string => {
  if (!method) return "Non spécifié";
  
  const methods: Record<string, string> = {
    "card": "Carte bancaire",
    "check": "Chèque",
    "cash": "Espèces",
    "transfer": "Virement bancaire"
  };
  
  return methods[method] || method;
};

export default function MesReservations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

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

  const handlePayNow = async (reservationId: number, stageId: number, stageTitle: string, stagePrice: number, typeStage: string) => {
    if (!session?.user?.id) {
      toast.error("Vous devez être connecté pour effectuer un paiement");
      return;
    }
    
    setPaymentLoading(reservationId);
    try {
      toast.info("Préparation du paiement...");
      
      // Inclure le userId depuis la session
      const res = await fetch("/api/stripe/update-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          stageId,
          stageTitle,
          stagePrice,
          userId: session.user.id, // IMPORTANT: Ajouter l'ID utilisateur ici
          typeStage,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Erreur de paiement:", errorData);
        throw new Error(errorData.error || "Erreur de paiement");
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur: URL de paiement manquante");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la préparation du paiement");
    } finally {
      setPaymentLoading(null);
    }
  };

  // 🆕 NOUVELLE FONCTION : Annuler une réservation
  const handleCancelReservation = async (reservationId: number, stageTitle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler votre réservation pour "${stageTitle}" ?`)) {
      return;
    }

    setCancelLoading(reservationId);
    try {
      const res = await fetch("/api/reservation/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          isAdmin: false
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation");
      }

      toast.success("Réservation annulée avec succès");
      
      // Recharger les réservations
      await fetchReservations();
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'annulation");
    } finally {
      setCancelLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
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
            {/* En-tête avec titre et badge */}
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold mr-3">{r.stage.Titre}</h2>
              
              {/* Badge de statut de paiement */}
              {r.paid === false ? (
                <div className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md flex items-center text-sm font-medium whitespace-nowrap">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  À payer
                </div>
              ) : (
                <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md flex items-center text-sm font-medium whitespace-nowrap">
                  <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  Payé
                </div>
              )}
            </div>
            
            <p className="mb-1 text-zinc-700">
              <span className="font-medium">Dates:</span> {new Date(r.stage.DateDebut).toLocaleDateString("fr-FR")} — {new Date(r.stage.DateFin).toLocaleDateString("fr-FR")}
            </p>
            <p className="mb-1 text-zinc-700">
              <span className="font-medium">Horaires:</span> {r.stage.HeureDebut} — {r.stage.HeureFin} et {r.stage.HeureDebut2} — {r.stage.HeureFin2}
            </p>
            <p className="mb-1 text-zinc-700">
              <span className="font-medium">Type:</span> {formatTypeStage(r.TypeStage)}
            </p>
            
            {/* Affichage du mode de paiement */}
            {r.paymentMethod && (
              <p className="mb-1 text-zinc-700 flex items-center">
                <span className="font-medium mr-1">Paiement:</span>
                <CreditCard className="w-4 h-4 mr-1 text-zinc-500" /> 
                {formatPaymentMethod(r.paymentMethod)}
              </p>
            )}
            
            <p className="mb-3 text-lg font-bold">{r.stage.Prix}€</p>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button variant="outline" onClick={() => router.push(`/stage/${r.stage.id}`)}>
                Voir le stage
              </Button>
              
              {r.paid === false && (
                <>
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handlePayNow(r.id, r.stage.id, r.stage.Titre, r.stage.Prix, r.TypeStage)}
                    disabled={paymentLoading === r.id || cancelLoading === r.id}
                  >
                    {paymentLoading === r.id ? "Traitement..." : "Payer maintenant"}
                  </Button>
                  
                  {/* 🆕 NOUVEAU : Bouton d'annulation */}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleCancelReservation(r.id, r.stage.Titre)}
                    disabled={paymentLoading === r.id || cancelLoading === r.id}
                    className="flex items-center gap-1"
                  >
                    {cancelLoading === r.id ? (
                      "Annulation..."
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        Annuler
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            
            {/* Alerte pour paiement non effectué */}
            {r.paid === false && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <p className="font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  N'oubliez pas de régler votre réservation pour garantir votre place.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <PaginationItem key={num}>
                <PaginationLink isActive={num === currentPage} onClick={() => setCurrentPage(num)}>
                  {num}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}