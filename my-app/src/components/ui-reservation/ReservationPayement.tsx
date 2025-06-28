"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkPreview } from "@/components/ui/link-preview";
import PaymentButton from "@/components/Stripe/paymentButton";
import ReserveWithoutPaymentButton from "@/components/Stripe/ReserveWithoutPaymentButton";
import CancelReservationDialog from "@/components/ui-reservation/CancelResa";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Euro, 
  Hash,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  ExternalLink
} from "lucide-react";

export default function ReservationFormClient({ stage }: { stage: any }) {
  const [typeStage, setTypeStage] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [acceptRules, setAcceptRules] = useState(false);
  const [confirmPointsCheck, setConfirmPointsCheck] = useState(false);
  
  // Récupérer la session et l'ID utilisateur
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        console.log("Session:", session);
        const uid = session?.user?.id;
        if (uid) {
          setUserId(Number(uid));
        } else {
          console.error("No user ID in session:", session);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };
    
    fetchSession();
  }, []);
  
  // Log when type changes for debugging
  useEffect(() => {
    console.log("Type de stage sélectionné:", typeStage);
  }, [typeStage]);
  
  const handleTypeChange = (value: string) => {
    setTypeStage(value);
    console.log(`Type changé à: ${value}`);
  };

  // Vérifier si toutes les conditions sont remplies pour activer le paiement
  const canProceedToPayment = typeStage && acceptCGU && acceptRules && confirmPointsCheck;
  
  const stageTypes = [
    { 
      value: "recuperation_points", 
      label: "Cas n°1 : Récupération des points",
      description: "Stage volontaire pour récupérer jusqu'à 4 points",
      color: "bg-green-50 border-green-200 text-green-800"
    },
    { 
      value: "permis_probatoire", 
      label: "Cas n°2 : Permis probatoire (lettre Réf. 48N)",
      description: "Stage obligatoire suite à une perte de points en période probatoire",
      color: "bg-orange-50 border-orange-200 text-orange-800"
    },
    { 
      value: "alternative_poursuites", 
      label: "Cas n°3 : Alternative aux poursuites pénales",
      description: "Stage proposé par le Procureur en alternative aux poursuites",
      color: "bg-blue-50 border-blue-200 text-blue-800"
    },
    { 
      value: "peine_complementaire", 
      label: "Cas n°4 : Peine complémentaire",
      description: "Stage imposé dans le cadre d'une peine complémentaire",
      color: "bg-purple-50 border-purple-200 text-purple-800"
    },
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">
            Récapitulatif de votre réservation
          </h1>
          <p className="text-blue-100 text-center text-lg">
            {stage.Titre}
          </p>
        </div>
      </div>

      {/* Informations du stage */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Détails du stage
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Numéro de stage</p>
                <p className="text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded text-sm">
                  {stage.NumeroStage}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Adresse</p>
                <p className="text-gray-800">{stage.Adresse}</p>
                <p className="text-gray-800">{stage.CodePostal} {stage.Ville}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Dates</p>
                <p className="text-gray-800">
                  Du {new Date(stage.DateDebut).toLocaleDateString("fr-FR")} au {new Date(stage.DateFin).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Horaires</p>
                <p className="text-gray-800">{stage.HeureDebut} - {stage.HeureFin}</p>
                <p className="text-gray-800">{stage.HeureDebut2} - {stage.HeureFin2}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Places disponibles</p>
                <p className="text-gray-800">{stage.PlaceDisponibles} places</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Euro className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Prix</p>
                <p className="text-2xl font-bold text-green-600">{stage.Prix}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sélection du type de stage */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Type de stage
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {stageTypes.map(({ value, label, description, color }) => (
            <div key={value} className="relative">
              <input
                type="radio"
                id={`type-${value}`}
                name="typeStage"
                value={value}
                checked={typeStage === value}
                onChange={() => handleTypeChange(value)}
                className="sr-only"
              />
              <label
                htmlFor={`type-${value}`}
                className={`
                  block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${typeStage === value 
                    ? `${color} border-current shadow-md transform scale-[1.02]` 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center
                    ${typeStage === value 
                      ? 'bg-current border-current' 
                      : 'border-gray-300'
                    }
                  `}>
                    {typeStage === value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className={`text-sm mt-1 ${typeStage === value ? 'opacity-80' : 'text-gray-600'}`}>
                      {description}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions et acceptations */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Conditions et vérifications
        </h2>
        
        <div className="space-y-6">
          {!typeStage && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                Veuillez d'abord sélectionner un type de stage ci-dessus.
              </p>
            </div>
          )}
          
          <div className={`space-y-4 ${!typeStage ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="acceptCGU" 
                checked={acceptCGU}
                onCheckedChange={(checked) => setAcceptCGU(checked === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="acceptCGU"
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  J'accepte les conditions générales d'utilisation d'EG-FORMATIONS
                </label>
                <div className="text-sm text-gray-600">
                  Consultez les{" "}
                  <LinkPreview 
                    url="http://localhost:3000/register/CGU" 
                    className="font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:no-underline transition-all duration-200 inline-flex items-center gap-1"
                  >
                    Conditions Générales d'Utilisation (CGU)
                    <ExternalLink className="w-3 h-3" />
                  </LinkPreview>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="acceptRules" 
                checked={acceptRules}
                onCheckedChange={(checked) => setAcceptRules(checked === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="acceptRules"
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  J'accepte le règlement intérieur et les règles d'inscription RGPD
                </label>
                <div className="text-sm text-gray-600">
                  Consultez le{" "}
                  <LinkPreview 
                    url="http://localhost:3000/register/reglement" 
                    className="font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:no-underline transition-all duration-200 inline-flex items-center gap-1"
                  >
                    Règlement intérieur et politique RGPD
                    <ExternalLink className="w-3 h-3" />
                  </LinkPreview>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="confirmPointsCheck" 
                checked={confirmPointsCheck}
                onCheckedChange={(checked) => setConfirmPointsCheck(checked === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="confirmPointsCheck"
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  J'ai consulté mon solde de points sur le site officiel du gouvernement
                </label>
                <div className="text-sm text-gray-600">
                  Vérifiez vos points sur{" "}
                  <LinkPreview 
                    url="https://www.telepoints.info" 
                    className="font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:no-underline transition-all duration-200 inline-flex items-center gap-1"
                  >
                    Télépoints (site officiel du gouvernement)
                    <ExternalLink className="w-3 h-3" />
                  </LinkPreview>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <CancelReservationDialog />
          
          <div 
            className={`
              flex-1 sm:flex-none transition-all duration-200
              ${!canProceedToPayment 
                ? 'opacity-50 pointer-events-none cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
            onClick={(e) => {
              if (!canProceedToPayment) {
                e.preventDefault();
                e.stopPropagation();
                toast.error("Veuillez sélectionner un type de stage et accepter toutes les conditions.");
                return;
              }
            }}
          >
            <ReserveWithoutPaymentButton
              stageId={stage.id}
              stageTitle={stage.Titre}
              stagePrice={stage.Prix}
              typeStage={typeStage}
              userId={userId}
              placesDisponibles={stage.PlaceDisponibles}
            />
          </div>
          
          <div 
            className={`
              flex-1 sm:flex-none transition-all duration-200
              ${!canProceedToPayment 
                ? 'opacity-50 pointer-events-none cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
            onClick={(e) => {
              if (!canProceedToPayment) {
                e.preventDefault();
                e.stopPropagation();
                toast.error("Veuillez sélectionner un type de stage et accepter toutes les conditions.");
                return;
              }
            }}
          >
            <PaymentButton
              stageId={stage.id}
              stageTitle={stage.Titre}
              stagePrice={stage.Prix}
              typeStage={typeStage}
            />
          </div>
        </div>
        
        {!canProceedToPayment && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                Veuillez sélectionner un type de stage et accepter toutes les conditions pour continuer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}