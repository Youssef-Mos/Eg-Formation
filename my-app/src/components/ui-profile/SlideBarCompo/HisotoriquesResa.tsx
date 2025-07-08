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
  FileText,
  Trash2,
  X
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

// ✅ NOUVEAU : Fonction pour formater les dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Non spécifié";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "Date invalide";
  }
};

// ✅ NOUVEAU : Fonction pour formater une période de dates
const formatDateRange = (dateDebut?: string, dateFin?: string): string => {
  if (!dateDebut && !dateFin) return "Dates non spécifiées";
  if (!dateDebut) return `Jusqu'au ${formatDate(dateFin)}`;
  if (!dateFin) return `À partir du ${formatDate(dateDebut)}`;
  
  try {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    
    // Si c'est le même jour
    if (debut.toDateString() === fin.toDateString()) {
      return formatDate(dateDebut);
    }
    
    // Si c'est le même mois et la même année
    if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
      return `${debut.getDate()} - ${fin.getDate()} ${debut.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
    }
    
    // Sinon, affichage complet
    return `${formatDate(dateDebut)} - ${formatDate(dateFin)}`;
  } catch {
    return "Période invalide";
  }
};

// ✅ NOUVEAU : Fonction pour déterminer le statut temporel d'un stage
const getStageTimeStatus = (dateDebut?: string, dateFin?: string) => {
  if (!dateDebut) return { status: 'unknown', label: 'Date inconnue', color: 'text-gray-500' };
  
  const now = new Date();
  const debut = new Date(dateDebut);
  const fin = dateFin ? new Date(dateFin) : debut;
  
  if (fin < now) {
    return { status: 'past', label: 'Terminé', color: 'text-gray-500' };
  } else if (debut <= now && now <= fin) {
    return { status: 'ongoing', label: 'En cours', color: 'text-green-600' };
  } else {
    const daysUntil = Math.ceil((debut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { status: 'soon', label: `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`, color: 'text-orange-600' };
    } else {
      return { status: 'future', label: 'À venir', color: 'text-blue-600' };
    }
  }
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
  const [cancelProcessing, setCancelProcessing] = useState<number | null>(null);
  const [expandedStageView, setExpandedStageView] = useState(false);
  const expandedSectionRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: session } = useSession();
  const router = useRouter();

  // ✅ MODIFIÉ : Fetch all stages avec tri par date
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch('/api/Stage/RecupStage');
        if (!res.ok) throw new Error('Erreur récupération des stages');
        const data: Stage[] = await res.json();
        
        // ✅ TRI PAR DATE : Les stages les plus proches en premier
        const sortedStages = data.sort((a, b) => {
          // Gérer les cas où les dates peuvent être nulles
          if (!a.DateDebut && !b.DateDebut) return 0;
          if (!a.DateDebut) return 1; // a va à la fin
          if (!b.DateDebut) return -1; // b va à la fin
          
          const dateA = new Date(a.DateDebut).getTime();
          const dateB = new Date(b.DateDebut).getTime();
          return dateA - dateB; // Tri croissant : les plus proches en premier
        });
        
        setStages(sortedStages);
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

  // Annuler une réservation (côté admin)
  const handleCancelReservation = async (userId: number, reservationId: number, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la réservation de ${userName} ?`)) {
      return;
    }

    setCancelProcessing(reservationId);
    try {
      const res = await fetch('/api/reservation/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId,
          isAdmin: true
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'annulation');
      }

      toast.success(`Réservation de ${userName} annulée avec succès`);
      
      // Recharger les détails du stage
      if (selectedStageDetails) {
        await loadStageDetails(selectedStageDetails.id);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setCancelProcessing(null);
    }
  };

  // Gérer les factures pour un participant
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
        <div>
          <h1 className="text-2xl font-bold">Historique des Réservations</h1>
          <p className="text-gray-600 text-sm mt-1">
            {stages.length} stage{stages.length > 1 ? 's' : ''} • Triés par date de début
          </p>
        </div>
        {/* Bouton pour accéder à la gestion globale des factures */}
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
              <div>
                <h2 className="text-xl font-bold">{selectedStageDetails.Titre}</h2>
                {/* ✅ AJOUT : Affichage des dates dans l'en-tête */}
                <p className="text-zinc-300 text-sm mt-1">
                  📅 {formatDateRange(selectedStageDetails.DateDebut, selectedStageDetails.DateFin)}
                </p>
              </div>
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
                              <>
                                <Button 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => profile.reservation && handleValidatePayment(
                                    profile.id, 
                                    selectedStageDetails.id, 
                                    profile.reservation.id
                                  )}
                                  disabled={paymentProcessing === profile.reservation?.id || cancelProcessing === profile.reservation?.id}
                                >
                                  {paymentProcessing === profile.reservation?.id ? 
                                    "Validation..." : 
                                    "Valider paiement"}
                                </Button>
                                
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                  onClick={() => profile.reservation && handleCancelReservation(
                                    profile.id, 
                                    profile.reservation.id, 
                                    `${profile.prenom} ${profile.nom}`
                                  )}
                                  disabled={paymentProcessing === profile.reservation?.id || cancelProcessing === profile.reservation?.id}
                                >
                                  {cancelProcessing === profile.reservation?.id ? (
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
                            
                            {/* Bouton pour gérer la facture */}
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
                              stages={stages.map(s => ({
                                id: s.id,
                                Titre: s.Titre,
                                PlaceDisponibles: s.PlaceDisponibles,
                                DateDebut: s.DateDebut ? new Date(s.DateDebut) : new Date(0),
                                DateFin: s.DateFin ? new Date(s.DateFin) : new Date(0),
                                Ville: s.Ville || "",
                                CodePostal: s.CodePostal || ""
                              }))}
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
  
      {/* ✅ MODIFIÉ : Grille des stages avec dates */}
      {!expandedStageView && (
        <>
          {loadingStages ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStages.map(stage => {
                const timeStatus = getStageTimeStatus(stage.DateDebut, stage.DateFin);
                
                return (
                  <div key={stage.id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* ✅ En-tête avec titre et statut */}
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">{stage.Titre}</h2>
                      
                      {/* ✅ NOUVEAU : Affichage des dates */}
                      <div className="flex items-center text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm font-medium">
                          {formatDateRange(stage.DateDebut, stage.DateFin)}
                        </span>
                      </div>
                      
                      {/* ✅ NOUVEAU : Statut temporel */}
                      <div className={`text-xs font-medium ${timeStatus.color} mb-2`}>
                        {timeStatus.label}
                      </div>
                      
                      {/* ✅ NOUVEAU : Localisation si disponible */}
                      {stage.Ville && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{stage.Ville} ({stage.CodePostal})</span>
                        </div>
                      )}
                    </div>
                    
                    {/* ✅ Footer avec places et bouton */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-zinc-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {stage.PlaceDisponibles > 0 
                              ? `${stage.PlaceDisponibles} place${stage.PlaceDisponibles > 1 ? 's' : ''} restante${stage.PlaceDisponibles > 1 ? 's' : ''}`
                              : 'Complet'
                            }
                          </span>
                        </div>
                        
                        {/* ✅ NOUVEAU : Indicateur visuel pour les places */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stage.PlaceDisponibles === 0 
                            ? 'bg-red-100 text-red-700'
                            : stage.PlaceDisponibles <= 2 
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {stage.PlaceDisponibles === 0 
                            ? 'Complet'
                            : stage.PlaceDisponibles <= 2 
                              ? 'Dernières places'
                              : 'Disponible'
                          }
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        className="w-full hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => {
                          setSelectedStage(stage.id);
                          loadStageDetails(stage.id);
                        }}
                      >
                        Voir les détails et participants
                      </Button>
                    </div>
                  </div>
                );
              })}
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