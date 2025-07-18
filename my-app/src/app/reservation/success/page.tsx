"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, MapPinIcon, MailIcon, FileTextIcon, ArrowDownIcon, CreditCardIcon, CheckCircleIcon } from 'lucide-react';

// ✅ NOUVEAU : Composant qui utilise useSearchParams
function SuccessPageContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const reservationId = params.get("reservationId"); // Récupérer l'ID de réservation si présent
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState<any>(null);

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!sessionId && !reservationId) {
        setError("Identifiant de session ou de réservation manquant");
        setLoading(false);
        return;
      }

      try {
        // Mettre à jour la réservation si c'est un changement de méthode de paiement
        if (reservationId) {
          const updateResponse = await fetch("/api/stripe/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, reservationId }),
          });
          
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.error || "Erreur lors de la mise à jour du paiement");
          }
        }

        // Récupérer les détails de la réservation
        const response = await fetch(`/api/reservation/details?${sessionId ? `session_id=${sessionId}` : `reservation_id=${reservationId}`}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la récupération des détails");
        }
        
        const data = await response.json();
        setReservationData(data);
      } catch (err: any) {
        console.error("Erreur:", err);
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchReservationDetails();
  }, [sessionId, reservationId]);

  const handleDownloadPDF = () => {
    if (!reservationData) return;
    
    const { user, stage, typeStage } = reservationData;
    
    // Redirection vers l'API de téléchargement avec les paramètres nécessaires
    window.open(`/api/reservation/download-pdf?userId=${user.id}&stageId=${stage.id}&typeStage=${typeStage.code}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50">
        <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-600">Chargement des détails de votre réservation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Une erreur est survenue</h1>
          <p className="text-zinc-600 mb-6">{error}</p>
          <Link href="/" className="bg-zinc-800 text-white py-2 px-4 rounded hover:bg-zinc-700 transition">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!reservationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-zinc-800 mb-4">Informations non disponibles</h1>
          <p className="text-zinc-600 mb-6">Les détails de votre réservation ne sont pas disponibles.</p>
          <Link href="/" className="bg-zinc-800 text-white py-2 px-4 rounded hover:bg-zinc-700 transition">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const { stage, typeStage, user, session, paymentMethod } = reservationData;

  // Formatage du mode de paiement
  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      "card": "Carte bancaire",
      "check": "Chèque",
      "cash": "Espèces",
      "transfer": "Virement bancaire"
    };
    return methods[method] || method;
  };

  const isNewPayment = !!reservationId; // Indique si c'est un paiement effectué à partir d'une réservation existante

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-zinc-50">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md overflow-hidden">
        {/* Bannière de succès */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircleIcon className="h-10 w-10 text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {isNewPayment ? "Paiement Effectué" : "Paiement Réussi"}
            </h1>
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              {isNewPayment 
                ? "Votre réservation a été mise à jour avec succès. Votre paiement par carte bancaire a été enregistré."
                : "Félicitations ! Votre réservation a été confirmée."} 
              Une convocation a été envoyée à votre adresse email ({user.email}).
            </p>
          </div>

          {/* Détails de la réservation */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-zinc-800 mb-4 pb-2 border-b border-zinc-200">
              Détails de votre réservation
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <CalendarIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Stage :
                </div>
                <div className="text-zinc-800 font-semibold">{stage.Titre}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <FileTextIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Type de stage :
                </div>
                <div className="text-zinc-800">{typeStage.formatted}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <MapPinIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Adresse :
                </div>
                <div className="text-zinc-800">{stage.Adresse}, {stage.CodePostal} {stage.Ville}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <CalendarIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Dates :
                </div>
                <div className="text-zinc-800">
                  Du {new Date(stage.DateDebut).toLocaleDateString()} au {new Date(stage.DateFin).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <ClockIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Horaires :
                </div>
                <div className="text-zinc-800">{stage.HeureDebut} - {stage.HeureFin} et {stage.HeureDebut2} - {stage.HeureFin2}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <CreditCardIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Montant payé :
                </div>
                <div className="text-zinc-800 font-semibold">{stage.Prix} €</div>
              </div>
              
              {/* Ajout du mode de paiement */}
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <CreditCardIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Mode de paiement :
                </div>
                <div className="text-zinc-800">
                  {getPaymentMethodLabel(paymentMethod || "card")}
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Payé</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="min-w-36 flex items-center text-zinc-700 font-medium mb-1 sm:mb-0">
                  <MailIcon className="w-5 h-5 mr-2 text-zinc-500" />
                  Confirmation :
                </div>
                <div className="text-zinc-800">Envoyée à {user.email}</div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">Instructions importantes</h3>
            <ul className="text-blue-700 space-y-1 pl-5 list-disc">
              <li>Conservez précieusement votre convocation de réservation</li>
              <li>Présentez-vous 15 minutes avant le début du stage</li>
              <li>N&apos;oubliez pas votre pièce d&apos;identité et votre permis de conduire</li>
              {typeStage.code === "permis_probatoire" && (
                <li>Apportez obligatoirement votre lettre 48N</li>
              )}
            </ul>
          </div>
          
          {/* Boutons d'actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center bg-zinc-800 text-white py-3 px-6 rounded-lg hover:bg-zinc-700 transition font-medium"
            >
              <ArrowDownIcon className="w-5 h-5 mr-2" />
              Télécharger l&apos;convocation PDF
            </button>
            
            <Link 
              href="/profil"
              className="flex items-center justify-center bg-zinc-200 text-zinc-800 py-3 px-6 rounded-lg hover:bg-zinc-300 transition font-medium"
            >
              Voir mes réservations
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-zinc-100 px-6 py-4 text-center">
          <p className="text-zinc-600 text-sm">
            Pour toute question, contactez-nous à <span className="font-medium">contact@eg-formation.fr</span>
          </p>
        </div>
      </div>
      
      {/* Numéro de commande */}
      <div className="mt-4 text-zinc-500 text-sm">
        Commande #{sessionId?.substring(0, 8) || reservationId}
      </div>
    </div>
  );
}

// ✅ NOUVEAU : Composant principal avec Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50">
        <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-600">Chargement de votre confirmation...</p>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}