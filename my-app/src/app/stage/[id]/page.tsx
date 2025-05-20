"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Euro, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

interface Stage {
  id: number;
  Titre: string;
  Description: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  DateDebut: string;
  DateFin: string;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2?: string;
  HeureFin2?: string;
  Prix: number;
  PlaceDisponibles: number;
}

interface Reservation {
  id: number;
  userId: number;
  stageId: number;
  createdAt: string;
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
import { useParams } from "next/navigation";

export default function StageDetail() {
  const { id } = useParams();

  const { data: session, status } = useSession();
  const router = useRouter();
  const [stage, setStage] = useState<Stage | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/login");
    return;
  }

  if (status === "authenticated" && id) {
    fetchStageAndReservation(parseInt(id as string, 10));
  }
}, [status, id]);


  const fetchStageAndReservation = async (stageId: number) => {
  setLoading(true);
  try {
    // 1. Fetch stage details
    const stageRes = await fetch(`/api/Stage/RecupStageById?id=${stageId}`);
    if (!stageRes.ok) {
      const error = await stageRes.json();
      throw new Error(`Erreur stage (${stageRes.status}): ${error.error || 'Inconnu'}`);
    }
    const stageData = await stageRes.json();
    setStage(stageData);
    
    // 2. Fetch user's reservation for this stage
    try {
      const reservationRes = await fetch(`/api/reservation/user-stage?stageId=${stageId}`);
      if (reservationRes.ok) {
        const reservationData = await reservationRes.json();
        setReservation(reservationData);
      } else if (reservationRes.status === 404) {
        // Pas de réservation trouvée, c'est normal
        setReservation(null);
      } else {
        console.error("Erreur réservation:", await reservationRes.json());
        // Ne pas bloquer l'affichage du stage si la réservation échoue
      }
    } catch (resErr) {
      console.error("Erreur lors du chargement de la réservation:", resErr);
      // Ne pas bloquer l'affichage du stage si la réservation échoue
    }
  } catch (err) {
    console.error(err);
    toast.error(err instanceof Error ? err.message : "Impossible de charger les détails du stage");
  } finally {
    setLoading(false);
  }
};

  const handleDownloadPDF = async () => {
    if (!reservation || !stage || !session?.user?.id) return;
    
    setPdfLoading(true);
    try {
      // Create the URL with query parameters
      const downloadUrl = `/api/reservation/download-pdf?userId=${session.user.id}&stageId=${stage.id}&typeStage=${reservation.TypeStage}`;
      
      // Open in a new tab/window
      window.open(downloadUrl, '_blank');
      
      toast.success("Téléchargement de l'attestation démarré");
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      toast.error("Erreur lors du téléchargement de l'attestation");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <>
          <div className="sticky flex justify-center items-center flex-col gap-10 z-50">

        <div className="sticky top-0 z-50">
                              <Nav />
                          </div>
        <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-600">Chargement des détails du stage...</p>
          </div>
        </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!stage) {
    return (
      <>
          <div className="sticky flex justify-center items-center flex-col gap-10 z-50">

        <div className="sticky top-0 z-50">
                              <Nav />
                          </div>
        <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Stage non trouvé</h1>
            <p className="text-gray-600 mb-6">Le stage demandé n'existe pas ou a été supprimé.</p>
            <Button onClick={() => router.push("/profil")}>
              Retour à mes réservations
            </Button>
          </div>
        </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
    <div className="sticky flex justify-center items-center flex-col gap-10 z-50">

                  <div className="sticky top-0 z-50">
                              <Nav />
                          </div>
              
      <div className="container mx-auto p-4 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{stage.Titre}</h1>
            
            {reservation && (
              <div className="flex items-center text-green-600 mb-4">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Vous êtes inscrit à ce stage</span>
              </div>
            )}
            
            {stage.Description && (
              <p className="text-zinc-600 mb-4">{stage.Description}</p>
            )}
            
            {/* Bannière d'attestation si réservé */}
            {reservation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Attestation de réservation
                </h3>
                <p className="text-blue-700 mb-3">
                  Vous pouvez télécharger votre attestation de réservation à tout moment.
                </p>
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={pdfLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {pdfLoading ? "Téléchargement..." : "Télécharger l'attestation"}
                </Button>
              </div>
            )}
          </div>
          
          {/* Détails du stage */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-zinc-200">
              Détails du stage
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Dates</p>
                    <p className="text-zinc-800">
                      {new Date(stage.DateDebut).toLocaleDateString("fr-FR")} au {new Date(stage.DateFin).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Horaires</p>
                    <p className="text-zinc-800">{stage.HeureDebut} - {stage.HeureFin}</p>
                    {stage.HeureDebut2 && stage.HeureFin2 && (
                      <p className="text-zinc-800">{stage.HeureDebut2} - {stage.HeureFin2}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Euro className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Prix</p>
                    <p className="text-zinc-800 font-bold">{stage.Prix} €</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Adresse</p>
                    <p className="text-zinc-800">{stage.Adresse}</p>
                    <p className="text-zinc-800">{stage.CodePostal} {stage.Ville}</p>
                  </div>
                </div>
                
                {reservation && (
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-700">Type de stage</p>
                      <p className="text-zinc-800">{formatTypeStage(reservation.TypeStage)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Réservé le</p>
                    <p className="text-zinc-800">
                      {reservation ? new Date(reservation.createdAt).toLocaleDateString("fr-FR") : "Non réservé"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informations importantes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-zinc-200">
              Informations importantes
            </h2>
            
            <div className="space-y-4 text-zinc-700">
              <p>
                <span className="font-medium">Présentation :</span> Merci de vous présenter 15 minutes avant le début du stage avec votre pièce d'identité et votre attestation.
              </p>
              
              <p>
                <span className="font-medium">Documents nécessaires :</span> N'oubliez pas d'apporter votre permis de conduire et la lettre 48N si applicable.
              </p>
              
              <p>
                <span className="font-medium">Règlement :</span> Le stage doit être suivi dans son intégralité pour être validé. Aucun retard ou absence ne sera toléré.
              </p>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => router.push("/profil")}
              className="w-full sm:w-auto"
            >
              Retour à mes réservations
            </Button>
            
            {reservation && (
              <Button 
                onClick={handleDownloadPDF} 
                disabled={pdfLoading}
                className="w-full sm:w-auto"
              >
                {pdfLoading ? "Téléchargement..." : "Télécharger l'attestation"}
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}