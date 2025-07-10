'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EditStageModal from "../admin/EditStage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Calendar,             
  MapPin, 
  Clock, 
  Users, 
  Euro, 
  Hash,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  Trash2,
  UserCheck,
  AlertCircle,
  EyeOff,  // Pour masquage manuel
  Eye,     // Pour démasquage manuel
  ClockIcon, // Pour stages terminés
  CheckCircle // Pour stages terminés
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ✅ INTERFACE MISE À JOUR avec le nouveau champ de notification
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
  createdAt: Date;
  hidden: boolean;
  updatedAt: Date;
  completionNotificationSent?: boolean; // ✅ NOUVEAU CHAMP pour les notifications
}

// ✅ INTERFACE MISE À JOUR avec le nouveau système de filtres
interface FilterValues {
  ville: string;
  departement: string;
  dateDebut: Date | null; // ✅ Renommé de "date" vers "dateDebut" 
  motsCles: string;
  placesDisponibles: [number, number];
  statutStage: 'tout' | 'en-cours' | 'termines'; // ✅ NOUVEAU champ pour le statut
}

interface ListeStagesProps {
  filters: FilterValues;
}

// ✅ FONCTION pour vérifier si un stage est terminé (un jour après la fin)
const isStageFinished = (dateFin: Date): boolean => {
  const now = new Date();
  const stageEndDate = new Date(dateFin);
  // Ajouter 1 jour après la fin du stage
  const oneDayAfterEnd = new Date(stageEndDate);
  oneDayAfterEnd.setDate(oneDayAfterEnd.getDate() + 1);
  
  return now > oneDayAfterEnd;
};

// ✅ FONCTION pour vérifier si un stage est en cours
const isStageOngoing = (dateDebut: Date, dateFin: Date): boolean => {
  const now = new Date();
  const startDate = new Date(dateDebut);
  const endDate = new Date(dateFin);
  
  return now >= startDate && now <= endDate;
};

// Fonction pour obtenir un message d'erreur détaillé
const getDeleteErrorMessage = (errorCode: string, reservationsCount?: number) => {
  switch (errorCode) {
    case 'STAGE_HAS_RESERVATIONS':
      return {
        title: 'Suppression impossible',
        description: `Ce stage ne peut pas être supprimé car il contient ${reservationsCount || 'des'} réservation(s) active(s). Vous devez d'abord déplacer ou annuler toutes les réservations avant de pouvoir supprimer ce stage.`,
        icon: <UserCheck className="w-6 h-6 text-orange-500" />
      };
    case 'INVALID_STAGE_ID':
      return {
        title: 'Erreur d\'identification',
        description: 'L\'identifiant du stage est invalide. Veuillez rafraîchir la page et réessayer.',
        icon: <AlertCircle className="w-6 h-6 text-red-500" />
      };
    case 'STAGE_NOT_FOUND':
      return {
        title: 'Stage introuvable',
        description: 'Ce stage n\'existe plus dans la base de données. Il a peut-être déjà été supprimé.',
        icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />
      };
    case 'AUTH_REQUIRED':
    case 'ADMIN_REQUIRED':
      return {
        title: 'Droits insuffisants',
        description: 'Vous n\'avez pas les permissions nécessaires pour supprimer ce stage. Veuillez vous reconnecter en tant qu\'administrateur.',
        icon: <Ban className="w-6 h-6 text-red-500" />
      };
    default:
      return {
        title: 'Erreur de suppression',
        description: 'Une erreur inattendue s\'est produite lors de la suppression. Veuillez réessayer ou contacter le support technique.',
        icon: <AlertTriangle className="w-6 h-6 text-red-500" />
      };
  }
};

export default function ListeStages({ filters }: ListeStagesProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ SUPPRIMÉ : const [notifiedStages, setNotifiedStages] = useState<Set<number>>(new Set());

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // États pour la confirmation de suppression
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ État pour gérer les stages en cours de masquage/démasquage (loading)
  const [hidingStages, setHidingStages] = useState<Set<number>>(new Set());

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  // ✅ NOUVELLE FONCTION DE NOTIFICATION avec gestion BDD
  const sendAdminNotification = async (stage: Stage) => {
    try {
      console.log(`📧 Tentative d'envoi de notification pour stage complet: ${stage.NumeroStage}`);
      
      const response = await fetch('/api/admin/stage-complete-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId: stage.id,
          stageTitle: stage.Titre,
          stageNumber: stage.NumeroStage,
          stageDate: stage.DateDebut,
          stageLocation: `${stage.Adresse}, ${stage.CodePostal} ${stage.Ville}`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.emailConfigured) {
          console.log(`✅ Notification email envoyée pour le stage complet: ${stage.NumeroStage}`);
        } else {
          console.log(`⚠️ Notification loggée pour le stage complet: ${stage.NumeroStage} (email non configuré)`);
        }
        
        // ✅ NOUVEAU : Marquer le stage comme notifié en BDD
        try {
          const markResponse = await fetch(`/api/Stage/MarkNotified/${stage.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completionNotificationSent: true })
          });
          
          if (markResponse.ok) {
            // Mettre à jour l'état local
            setStages(prev => prev.map(s => 
              s.id === stage.id 
                ? { ...s, completionNotificationSent: true }
                : s
            ));
            console.log(`✅ Stage ${stage.NumeroStage} marqué comme notifié en BDD`);
          } else {
            console.error('❌ Erreur lors du marquage en BDD:', await markResponse.json());
          }
          
        } catch (dbError) {
          console.error('❌ Erreur lors de la mise à jour de la notification en BDD:', dbError);
        }
      } else {
        // Gestion des erreurs de l'API de notification
        if (result.emailConfigured === false) {
          console.log(`⚠️ Notification stage ${stage.NumeroStage} - Email non configuré, procédure normale`);
          
          // Même si l'email n'est pas configuré, marquer comme notifié pour éviter les tentatives répétées
          try {
            await fetch(`/api/Stage/MarkNotified/${stage.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ completionNotificationSent: true })
            });
            
            setStages(prev => prev.map(s => 
              s.id === stage.id 
                ? { ...s, completionNotificationSent: true }
                : s
            ));
          } catch (dbError) {
            console.error('❌ Erreur lors du marquage en BDD:', dbError);
          }
        } else {
          console.error('❌ Erreur notification:', result);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification admin:', error);
    }
  };

  // ✅ useEffect CORRIGÉ avec nouvelle logique de notification
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch("/api/Stage/RecupStage");
        if (!res.ok) throw new Error("Erreur de récupération");
        const data = await res.json();
        
        // ✅ Trier les stages par date de stage (DateDebut) chronologique
        const sortedStages = data.sort((a: Stage, b: Stage) => {
          const dateA = new Date(a.DateDebut).getTime();
          const dateB = new Date(b.DateDebut).getTime();
          return dateA - dateB;
        });
        
        // ✅ NOUVELLE LOGIQUE : Vérifier les stages complets avec BDD tracking
        sortedStages.forEach((stage: Stage) => {
          // Envoyer notification seulement si:
          // 1. Le stage est complet (PlaceDisponibles === 0)
          // 2. ET la notification n'a pas encore été envoyée
          if (stage.PlaceDisponibles === 0 && !stage.completionNotificationSent) {
            console.log(`📧 Stage complet détecté, envoi notification: ${stage.NumeroStage}`);
            sendAdminNotification(stage);
          }
        });
        
        setStages(sortedStages);
      } catch (error) {
        console.error(error);
        toast.error("Erreur réseau");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();
  }, []); // ✅ PLUS DE DÉPENDANCES sur notifiedStages

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  const handleDeleteClick = (stage: Stage) => {
    setStageToDelete(stage);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stageToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/Stage/DeleteStage/${stageToDelete.id}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        const errorInfo = getDeleteErrorMessage(
          errorData.code, 
          errorData.reservationsCount
        );
        
        toast.error(
          <div className="flex items-start gap-3">
            {errorInfo.icon}
            <div>
              <div className="font-semibold">{errorInfo.title}</div>
              <div className="text-sm text-gray-600 mt-1">{errorInfo.description}</div>
            </div>
          </div>,
          { duration: 8000 }
        );
        return;
      }

      setStages((prev) => prev.filter((stage) => stage.id !== stageToDelete.id));
      toast.success(
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Stage "{stageToDelete.Titre}" supprimé avec succès</span>
        </div>
      );
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error("Erreur réseau lors de la suppression du stage");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setStageToDelete(null);
    }
  };

  // ✅ Fonction pour masquer/démasquer un stage avec API et persistance BDD
  const handleToggleHidden = async (stage: Stage) => {
    setHidingStages(prev => new Set(prev).add(stage.id));
    
    try {
      const newHiddenState = !stage.hidden;
      const res = await fetch(`/api/Stage/ToggleHidden/${stage.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hidden: newHiddenState })
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Gestion des erreurs spécifiques
        let errorMessage = 'Erreur lors du masquage/démasquage';
        switch (errorData.error) {
          case 'AUTH_REQUIRED':
            errorMessage = 'Authentification requise';
            break;
          case 'ADMIN_REQUIRED':
            errorMessage = 'Droits administrateur requis';
            break;
          case 'STAGE_NOT_FOUND':
            errorMessage = 'Stage non trouvé';
            break;
          case 'INVALID_STAGE_ID':
            errorMessage = 'ID de stage invalide';
            break;
          default:
            errorMessage = errorData.message || 'Erreur inconnue';
        }
        
        toast.error(
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <div className="font-semibold">Erreur de {newHiddenState ? 'masquage' : 'démasquage'}</div>
              <div className="text-sm text-gray-600 mt-1">{errorMessage}</div>
            </div>
          </div>,
          { duration: 6000 }
        );
        return;
      }

      const responseData = await res.json();
      
      // ✅ Mettre à jour le stage dans la liste avec les données de la réponse
      setStages((prev) =>
        prev.map((s) =>
          s.id === stage.id ? { ...s, hidden: newHiddenState } : s
        )
      );

      // Notification de succès
      toast.success(
        <div className="flex items-center gap-2">
          {newHiddenState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Stage "{stage.Titre}" {newHiddenState ? 'masqué' : 'démasqué'} avec succès</span>
        </div>
      );

      console.log('✅ Toggle hidden réussi:', responseData);

    } catch (error) {
      console.error('❌ Erreur lors du toggle hidden:', error);
      toast.error(
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <div className="font-semibold">Erreur réseau</div>
            <div className="text-sm text-gray-600 mt-1">
              Impossible de {stage.hidden ? 'démasquer' : 'masquer'} le stage. Vérifiez votre connexion.
            </div>
          </div>
        </div>,
        { duration: 6000 }
      );
    } finally {
      setHidingStages(prev => {
        const newSet = new Set(prev);
        newSet.delete(stage.id);
        return newSet;
      });
    }
  };

  const handleReservation = (stage: Stage) => {
    // Vérifier si le stage a encore des places
    if (stage.PlaceDisponibles === 0) {
      toast.error("Ce stage est complet. Aucune place disponible.");
      return;
    }

    // Vérifier si le stage est terminé
    if (isStageFinished(stage.DateFin)) {
      toast.error("Ce stage est terminé. Les réservations ne sont plus possibles.");
      return;
    }

    const targetUrl = `/reservation/${stage.id}`;
    if (!session) {
      // ✅ MODIFICATION : Rediriger vers l'inscription avec callback vers la réservation
      router.push(`/register?callbackUrl=${encodeURIComponent(targetUrl)}`);
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

  // ✅ NOUVELLE LOGIQUE DE FILTRAGE avec système de statut et date "à partir de"
  const filteredStages = stages.filter((stage) => {
    const isFinished = isStageFinished(stage.DateFin);
    const isOngoing = isStageOngoing(stage.DateDebut, stage.DateFin);
    const isManuallyHidden = stage.hidden; // ✅ Récupéré de la BDD
    
    // Pour les NON-ADMINS : masquer les stages terminés ET masqués manuellement
    if (!session?.user?.role || session.user.role !== "admin") {
      if (isFinished || isManuallyHidden) return false;
    }

    // ✅ SIMPLIFIÉ : Filtrage par statut de stage
    if (filters.statutStage !== 'tout') {
      if (filters.statutStage === 'en-cours') {
        // Afficher tous les stages NON terminés (disponibles + en cours)
        if (isFinished) return false;
      } else if (filters.statutStage === 'termines') {
        // Ne montrer que les stages terminés
        if (!isFinished) return false;
      }
    }

    // Filtre ville (inchangé)
    const matchVille =
      !filters.ville ||
      stage.Ville?.toLowerCase().includes(filters.ville.toLowerCase());

    // Filtre département (inchangé)
    const matchDepartement =
      !filters.departement ||
      stage.CodePostal.startsWith(filters.departement);

    // Filtre mots-clés (inchangé)
    const matchMotsCles =
      !filters.motsCles ||
      stage.Titre?.toLowerCase().includes(filters.motsCles.toLowerCase());

    // ✅ NOUVEAU : Filtre date "à partir de" au lieu de date exacte
    const matchDate =
      !filters.dateDebut ||
      new Date(stage.DateDebut) >= new Date(filters.dateDebut);

    // Filtre places disponibles (inchangé)
    const [minPlaces, maxPlaces] = filters.placesDisponibles;
    const matchPlaces = stage.PlaceDisponibles >= minPlaces && stage.PlaceDisponibles <= maxPlaces;

    return matchVille && matchDepartement && matchMotsCles && matchDate && matchPlaces;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStages = filteredStages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ✅ NOUVEAU : Calculer le statut pour l'affichage du header
  const getStatusMessage = () => {
    if (filters.statutStage === 'en-cours') {
      return `${filteredStages.length} stage(s) disponible(s) • Triés par date de stage`;
    } else if (filters.statutStage === 'termines') {
      return `${filteredStages.length} stage(s) terminé(s) • Triés par date de stage`;
    } else {
      return `${filteredStages.length} stage(s) disponible(s) • Triés par date de stage`;
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header moderne */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
          Catalogue des Stages
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {filteredStages.length > 0 
            ? getStatusMessage() // ✅ Utilise la nouvelle fonction pour afficher le statut
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
            {paginatedStages.map((stage) => {
              const isComplete = stage.PlaceDisponibles === 0;
              const isAlmostFull = stage.PlaceDisponibles <= 2 && stage.PlaceDisponibles > 0;
              const isFinished = isStageFinished(stage.DateFin);
              const isOngoing = isStageOngoing(stage.DateDebut, stage.DateFin);
              const isManuallyHidden = stage.hidden; // ✅ De la BDD
              const isHiding = hidingStages.has(stage.id);
              
              // ✅ Déterminer le style et les badges à afficher
              const cardStyle = isFinished || isManuallyHidden 
                ? 'bg-gray-100 border-gray-400 opacity-60' 
                : isComplete 
                  ? 'bg-gray-50 border-gray-300 opacity-75' 
                  : 'bg-white border-gray-200 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1';
              
              return (
                <div
                  key={stage.id}
                  className={`
                    group relative border rounded-2xl p-4 sm:p-6 shadow-sm transition-all duration-300 ease-in-out
                    ${cardStyle}
                  `}
                >
                  {/* ✅ Badge "TERMINÉ" pour les stages finis (visible admin seulement) */}
                  {isFinished && session?.user?.role === "admin" && (
                    <div className="absolute -top-2 -left-2 bg-slate-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                      <CheckCircle className="w-3 h-3" />
                      TERMINÉ
                    </div>
                  )}

                  {/* ✅ Badge "MASQUÉ" pour les stages masqués manuellement */}
                  {isManuallyHidden && session?.user?.role === "admin" && !isFinished && (
                    <div className="absolute -top-2 -left-2 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                      <EyeOff className="w-3 h-3" />
                      MASQUÉ
                    </div>
                  )}

                  {/* ✅ Badge "EN COURS" pour les stages actuellement en cours */}
                  {isOngoing && !isFinished && !isManuallyHidden && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                      <ClockIcon className="w-3 h-3" />
                      EN COURS
                    </div>
                  )}

                  {/* Badge "COMPLET" */}
                  {isComplete && !isFinished && !isManuallyHidden && !isOngoing && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                      <Ban className="w-3 h-3" />
                      COMPLET
                    </div>
                  )}

                  {/* Badge "Dernières places" */}
                  {isAlmostFull && !isComplete && !isFinished && !isManuallyHidden && !isOngoing && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                      <AlertTriangle className="w-3 h-3" />
                      DERNIÈRES PLACES
                    </div>
                  )}

                  {/* Header de la carte */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <h2 className={`
                      text-lg sm:text-xl font-bold transition-colors duration-200 line-clamp-2
                      ${isFinished || isManuallyHidden 
                        ? 'text-gray-500' 
                        : isComplete 
                          ? 'text-gray-500' 
                          : 'text-gray-800 group-hover:text-blue-600'
                      }
                    `}>
                      {stage.Titre}
                    </h2>
                    <div className={`
                      flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0
                      ${isFinished || isManuallyHidden || isComplete 
                        ? 'text-gray-400 bg-gray-200' 
                        : 'text-gray-500 bg-gray-50'
                      }
                    `}>
                      <Hash className="w-3 h-3" />
                      {stage.NumeroStage}
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-3 mb-6">
                    {/* Localisation */}
                    <div className="flex items-start gap-2">
                      <MapPin className={`
                        w-4 h-4 mt-0.5 flex-shrink-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-400' : 'text-blue-500'}
                      `} />
                      <div className={`
                        text-sm min-w-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-500' : 'text-gray-600'}
                      `}>
                        <p className="truncate">{stage.Adresse}</p>
                        <p className="font-medium">{stage.CodePostal} {stage.Ville}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2">
                      <Calendar className={`
                        w-4 h-4 flex-shrink-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-400' : 'text-green-500'}
                      `} />
                      <div className={`
                        text-sm min-w-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-500' : 'text-gray-600'}
                      `}>
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
                      <Clock className={`
                        w-4 h-4 mt-0.5 flex-shrink-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-400' : 'text-orange-500'}
                      `} />
                      <div className={`
                        text-sm min-w-0
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-500' : 'text-gray-600'}
                      `}>
                        <p>{stage.HeureDebut} - {stage.HeureFin}</p>
                        <p>{stage.HeureDebut2} - {stage.HeureFin2}</p>
                      </div>
                    </div>

                    {/* Places disponibles */}
                    <div className="flex items-center gap-2">
                      <Users className={`
                        w-4 h-4 flex-shrink-0
                        ${isComplete ? 'text-red-500' : isAlmostFull ? 'text-orange-500' : isFinished || isManuallyHidden ? 'text-gray-400' : 'text-purple-500'}
                      `} />
                      <span className={`
                        text-sm font-medium
                        ${isComplete ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : isFinished || isManuallyHidden ? 'text-gray-500' : 'text-gray-600'}
                      `}>
                        {isComplete 
                          ? 'Aucune place disponible' 
                          : `${stage.PlaceDisponibles} place${stage.PlaceDisponibles > 1 ? 's' : ''} disponible${stage.PlaceDisponibles > 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Footer de la carte */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                    {/* Prix */}
                    <div className="flex items-center gap-1">
                      <Euro className={`
                        w-5 h-5
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-400' : 'text-green-600'}
                      `} />
                      <span className={`
                        text-xl font-bold
                        ${isFinished || isManuallyHidden || isComplete ? 'text-gray-500' : 'text-gray-800'}
                      `}>
                        {stage.Prix}€
                      </span>
                    </div>

                    {/* Boutons d'action */}
                    {session?.user?.role === "admin" ? (
                      <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                        {/* Bouton Supprimer */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 sm:flex-none cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-1"
                          onClick={() => handleDeleteClick(stage)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                        
                        {/* Bouton Modifier */}
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none cursor-pointer hover:scale-105 transition-transform duration-200 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleOpenEdit(stage)}
                        >
                          Modifier
                        </Button>

                        {/* ✅ Bouton Masquer/Démasquer (seulement si pas terminé automatiquement) */}
                        {!isFinished && (
                          <Button
                            size="sm"
                            variant={isManuallyHidden ? "default" : "outline"}
                            className={`flex-1 sm:flex-none cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-1 ${
                              isManuallyHidden 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-gray-600 text-gray-600 hover:bg-gray-50'
                            }`}
                            onClick={() => handleToggleHidden(stage)}
                            disabled={isHiding}
                          >
                            {isHiding ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isManuallyHidden ? (
                              <>
                                <Eye className="w-4 h-4" />
                                Démasquer
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Masquer
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full sm:w-auto">
                        {isFinished ? (
                          <Button
                            size="sm"
                            disabled
                            className="w-full sm:w-auto bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            Stage terminé
                          </Button>
                        ) : isComplete ? (
                          <Button
                            size="sm"
                            disabled
                            className="w-full sm:w-auto bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            Stage complet
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className={`
                              w-full sm:w-auto cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg
                              ${isOngoing 
                                ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/25' 
                                : isAlmostFull 
                                  ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/25' 
                                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25'
                              }
                            `}
                            onClick={() => handleReservation(stage)}
                          >
                            {/* ✅ MODIFICATION : Texte différent selon l'état de connexion */}
                            {!session ? (
                              'S\'inscrire maintenant'
                            ) : isOngoing ? (
                              'Rejoindre maintenant !' 
                            ) : isAlmostFull ? (
                              'Réserver vite !' 
                            ) : (
                              'Réserver maintenant'
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* AlertDialog pour la confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Êtes-vous sûr de vouloir supprimer le stage suivant ?
              </div>
              {stageToDelete && (
                <div className="bg-gray-50 p-3 rounded-lg border space-y-1">
                  <div className="font-semibold text-gray-800">{stageToDelete.Titre}</div>
                  <div className="text-sm text-gray-600">
                    📍 {stageToDelete.Adresse}, {stageToDelete.CodePostal} {stageToDelete.Ville}
                  </div>
                  <div className="text-sm text-gray-600">
                    📅 Du {formatDate(stageToDelete.DateDebut)} au {formatDate(stageToDelete.DateFin)}
                  </div>
                  <div className="text-sm text-gray-600">
                    #{stageToDelete.NumeroStage} • {stageToDelete.PlaceDisponibles} places disponibles
                  </div>
                </div>
              )}
              <div className="text-sm text-red-600 font-medium">
                ⚠️ Cette action est irréversible et supprimera définitivement toutes les données associées.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Suppression...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  Supprimer définitivement
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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