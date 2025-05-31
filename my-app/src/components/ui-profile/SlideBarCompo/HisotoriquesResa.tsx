"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DeplacementClient } from "../Composant/DeplacementClient";
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  ChevronLeft,
  Receipt,
  FileText
} from "lucide-react";

interface Stage {
  id: number;
  Titre: string;
  PlaceDisponibles: number;
  DateDebut?: string;
  DateFin?: string;
  HeureDebut?: string;
  HeureFin?: string;
  Adresse?: string;
  CodePostal?: string;
  Ville?: string;
}

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  reservation?: {
    id: number;
    TypeStage: string;
    paymentMethod?: string;
    paid?: boolean;
    createdAt: string;
  };
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

export default function HistoriqueResa() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedStageDetails, setSelectedStageDetails] = useState<Stage | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState<number | null>(null);
  const [expandedStageView, setExpandedStageView] = useState(false);
  const expandedSectionRef = useRef<HTMLDivElement>(null);

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

  // Scroll to expanded section when it opens
  useEffect(() => {
    if (expandedStageView && expandedSectionRef.current) {
      expandedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expandedStageView]);

  // Fetch profiles and detailed stage info for a given stage
  const loadStageDetails = async (stageId: number) => {
    setLoadingProfiles(true);
    setExpandedStageView(true);
    
    try {
      // Récupérer les détails complets du stage
      const stageRes = await fetch(`/api/Stage/RecupStageById?id=${stageId}`);
      if (!stageRes.ok) throw new Error('Erreur récupération des détails du stage');
      const stageDetails = await stageRes.json();
      setSelectedStageDetails(stageDetails);
      
      // Récupérer les réservations et profils utilisateur
      const reservationsRes = await fetch(`/api/Stage/RecupByStage/${stageId}`);
      if (!reservationsRes.ok) throw new Error('Erreur récupération des réservations');
      
      const stageWithReservations = await reservationsRes.json();
  
      // Traiter les informations des utilisateurs
      const users: UserProfile[] = Array.isArray(stageWithReservations.reservations)
        ? stageWithReservations.reservations.map((r: any) => ({
            id: r.user.id,
            prenom: r.user.firstName || r.user.prenom || '',
            nom: r.user.lastName || r.user.nom || '',
            email: r.user.email,
            telephone: r.user.telephone || 'Non renseigné',
            reservation: {
              id: r.id,
              TypeStage: r.TypeStage,
              paymentMethod: r.paymentMethod,
              paid: r.paid,
              createdAt: r.createdAt
            }
          }))
        : [];
  
      setProfiles(users);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les données complètes');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Mark payment as validated (for non-online payments)
  const handleValidatePayment = async (userId: number, stageId: number, reservationId: number) => {
    setPaymentProcessing(reservationId);
    try {
      const res = await fetch('/api/reservation/validate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          stageId,
          reservationId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la validation du paiement');
      }

      toast.success('Paiement validé avec succès');
      
      // Reload profiles to update the paid status
      await loadStageDetails(stageId);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la validation du paiement');
    } finally {
      setPaymentProcessing(null);
    }
  };

  // NOUVELLE FONCTION : Gérer les factures pour un participant
  const handleManageInvoice = (userId: number, reservationId: number, userName: string) => {
    // Rediriger vers la page de gestion des factures avec les paramètres
    router.push(`/admin/factures?reservationId=${reservationId}&userId=${userId}&userName=${encodeURIComponent(userName)}`);
  };

  // Close expanded view and reset selection
  const handleCloseExpandedView = () => {
    setExpandedStageView(false);
    setSelectedStage(null);
    setSelectedStageDetails(null);
    setProfiles([]);
  };

  // Pagination calculations
  const totalPages = Math.ceil(stages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStages = stages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isGlobalLoading) {
    return (
      <div className="container mx-auto p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Mise à jour en cours...</h1>
        <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* En-tête avec bouton de gestion des factures */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des Réservations</h1>
        {/* NOUVEAU : Bouton pour accéder à la gestion globale des factures */}
        <Button
          onClick={() => router.push('/admin/factures')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Receipt className="w-4 h-4" />
          Gestion des factures
        </Button>
      </div>
      
      {/* Section étendue pour le stage sélectionné */}
      {expandedStageView && selectedStageDetails && (
        <div 
          ref={expandedSectionRef}
          className="mb-8 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300"
        >
          <div className="bg-zinc-800 text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedStageDetails.Titre}</h2>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-zinc-700"
                onClick={handleCloseExpandedView}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Retour
              </Button>
            </div>
          </div>
          
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-zinc-500 mr-2" />
                  <span className="font-medium">Dates:</span>
                  <span className="ml-2">
                    {selectedStageDetails.DateDebut && selectedStageDetails.DateFin ? 
                      `${new Date(selectedStageDetails.DateDebut).toLocaleDateString()} - ${new Date(selectedStageDetails.DateFin).toLocaleDateString()}` : 
                      'Non spécifié'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-zinc-500 mr-2" />
                  <span className="font-medium">Horaires:</span>
                  <span className="ml-2">
                    {selectedStageDetails.HeureDebut && selectedStageDetails.HeureFin ? 
                      `${selectedStageDetails.HeureDebut} - ${selectedStageDetails.HeureFin}` : 
                      'Non spécifié'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-zinc-500 mr-2" />
                  <span className="font-medium">Adresse:</span>
                  <span className="ml-2">
                    {selectedStageDetails.Adresse ? 
                      `${selectedStageDetails.Adresse}, ${selectedStageDetails.CodePostal} ${selectedStageDetails.Ville}` : 
                      'Non spécifié'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-zinc-500 mr-2" />
                  <span className="font-medium">Places disponibles:</span>
                  <span className="ml-2">{selectedStageDetails.PlaceDisponibles}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-zinc-500" />
              Participants ({profiles.length})
            </h3>
            
            {loadingProfiles ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
              </div>
            ) : profiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-100">
                      <th className="p-3 text-left">Participant</th>
                      <th className="p-3 text-left">Contact</th>
                      <th className="p-3 text-left">Type de stage</th>
                      <th className="p-3 text-left">Paiement</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b hover:bg-zinc-50">
                        <td className="p-3">
                          <div className="flex items-center">
                            <User className="w-5 h-5 text-zinc-400 mr-2" />
                            <div>
                              <p className="font-medium">{profile.prenom} {profile.nom}</p>
                              <p className="text-xs text-zinc-500">
                                Inscrit le {new Date(profile.reservation?.createdAt || '').toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="flex items-center">
                              <Mail className="w-4 h-4 text-zinc-400 mr-1" />
                              <a href={`mailto:${profile.email}`} className="text-blue-600 hover:underline">
                                {profile.email}
                              </a>
                            </p>
                            {profile.telephone && (
                              <p className="flex items-center mt-1">
                                <Phone className="w-4 h-4 text-zinc-400 mr-1" />
                                <a href={`tel:${profile.telephone}`} className="text-blue-600 hover:underline">
                                  {profile.telephone}
                                </a>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {profile.reservation?.TypeStage ? 
                            formatTypeStage(profile.reservation.TypeStage) : 
                            'Standard'}
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 text-zinc-400 mr-1" />
                              {profile.reservation?.paymentMethod ? 
                                formatPaymentMethod(profile.reservation.paymentMethod) : 
                                'Non spécifié'}
                            </div>
                            <div className="flex items-center mt-1">
                              {profile.reservation?.paid === false ? (
                                <span className="flex items-center text-red-600 text-sm">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Non payé
                                </span>
                              ) : (
                                <span className="flex items-center text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Payé
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            {profile.reservation?.paid === false && (
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => profile.reservation && handleValidatePayment(
                                  profile.id, 
                                  selectedStageDetails.id, 
                                  profile.reservation.id
                                )}
                                disabled={paymentProcessing === profile.reservation?.id}
                              >
                                {paymentProcessing === profile.reservation?.id ? 
                                  "Validation..." : 
                                  "Valider paiement"}
                              </Button>
                            )}
                            
                            {/* NOUVEAU : Bouton pour gérer la facture */}
                            {profile.reservation?.paid !== false && profile.reservation && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={() => handleManageInvoice(
                                  profile.id, 
                                  profile.reservation!.id, 
                                  `${profile.prenom} ${profile.nom}`
                                )}
                              >
                                <Receipt className="w-3 h-3" />
                                Facture
                              </Button>
                            )}
                            
                            <DeplacementClient
                              user={profile}
                              fromStageId={selectedStageDetails.id}
                              stages={stages}
                              refresh={() => loadStageDetails(selectedStageDetails.id)}
                              setGlobalLoading={setIsGlobalLoading}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                Aucune réservation pour ce stage.
              </div>
            )}
          </div>
        </div>
      )}
  
      {/* Grille des stages */}
      {!expandedStageView && (
        <>
          {loadingStages ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStages.map(stage => (
                <div key={stage.id} className="border p-4 rounded-lg bg-white shadow-sm">
                  <h2 className="text-xl font-semibold mb-2">{stage.Titre}</h2>
                  <div className="flex items-center text-zinc-600 mb-2">
                    <Users className="w-4 h-4 mr-1" />
                    <p>Places restantes: {stage.PlaceDisponibles}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedStage(stage.id);
                      loadStageDetails(stage.id);
                    }}
                  >
                    Voir les détails et participants
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
  
      {/* Pagination */}
      {!expandedStageView && totalPages > 1 && (
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