'use client';

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Nav from "@/components/nav";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import Footer from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkPreview } from "@/components/ui/link-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { 
  CalendarIcon, 
  Loader2, 
  User, 
  MapPin, 
  Car, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Globe,
  CreditCard
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

import CancelRegisterDialog from "@/components/ui-profile/Composant/CancelRegister";

// Liste des pays (échantillon)
const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Pays-Bas" },
  { code: "GB", name: "Royaume-Uni" },
];

// Simulateur d'API pour les adresses
const useAddressAutocomplete = (query: string) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const mockSuggestions = [
        `${searchQuery} Avenue de la République, 75011 Paris`,
        `${searchQuery} Rue de Rivoli, 75001 Paris`,
        `${searchQuery} Boulevard Saint-Germain, 75006 Paris`,
        `${searchQuery} Avenue des Champs-Élysées, 75008 Paris`,
        `${searchQuery} Rue de la Paix, 75002 Paris`,
      ].filter(addr => addr.toLowerCase().includes(searchQuery.toLowerCase()));
      
      setSuggestions(mockSuggestions);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    searchAddresses(query);
  }, [query, searchAddresses]);

  return { suggestions, isLoading };
};

// Composant de validation du mot de passe
const PasswordValidator = ({ password }: { password: string }) => {
  const validations = [
    { test: password.length >= 6, label: "Au moins 6 caractères" },
    { test: /[A-Z]/.test(password), label: "Une majuscule" },
    { test: /[0-9]/.test(password), label: "Un chiffre" },
    { test: /[^A-Za-z0-9]/.test(password), label: "Un caractère spécial" },
  ];

  const isValid = validations.every(v => v.test);

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <Shield className={cn("w-4 h-4", isValid ? "text-green-500" : "text-gray-400")} />
        <span className={cn("text-sm font-medium", isValid ? "text-green-600" : "text-gray-500")}>
          Sécurité du mot de passe
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {validations.map((validation, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              validation.test ? "bg-green-500" : "bg-gray-300"
            )} />
            <span className={cn(
              "text-xs transition-colors",
              validation.test ? "text-green-600" : "text-gray-500"
            )}>
              {validation.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ NOUVEAU : Composant qui utilise useSearchParams
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  // État actif pour la navigation - MODIFIÉ pour avoir 5 onglets au lieu de 6
  const [activeTab, setActiveTab] = useState("personal");
  const tabs = ["personal", "address", "billing", "permit", "account"]; // ✅ Supprimé "terms"
  const tabIndex = tabs.indexOf(activeTab);
  const progress = ((tabIndex + 1) / tabs.length) * 100;
  
  // États pour les fonctionnalités avancées
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [billingAddressQuery, setBillingAddressQuery] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showBillingAddressSuggestions, setShowBillingAddressSuggestions] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [billingCountryOpen, setBillingCountryOpen] = useState(false);
  
  const { suggestions: addressSuggestions, isLoading: isLoadingAddresses } = useAddressAutocomplete(addressQuery);
  const { suggestions: billingAddressSuggestions, isLoading: isLoadingBillingAddresses } = useAddressAutocomplete(billingAddressQuery);
  
  const [formData, setFormData] = useState({
    gender: 'male',
    lastName: '',
    firstName: '',
    name: '',
    birthDate: new Date(),
    birthPlace: '',
    address1: '',
    address2: '',
    address3: '',
    postalCode: '',
    city: '',
    country: 'FR',
    phone1: '',
    phone2: '',
    email: '',
    permitNumber: '',
    permitIssuedAt: '',
    permitDate: new Date(),
    username: '',
    password: '',
    confirmPassword: '',
    // CHAMPS DE FACTURATION
    useSameAddressForBilling: true,
    billingAddress1: '',
    billingAddress2: '',
    billingAddress3: '',
    billingPostalCode: '',
    billingCity: '',
    billingCountry: 'FR',
    // ✅ CONDITIONS GÉNÉRALES ACCEPTÉES PAR DÉFAUT (plus d'étape séparée)
    acceptTerms: true,
    acceptRules: true,
    confirmPointsCheck: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Gestion spéciale pour les adresses
    if (name === "address1") {
      setAddressQuery(value);
      setShowAddressSuggestions(value.length >= 3);
    }
    if (name === "billingAddress1") {
      setBillingAddressQuery(value);
      setShowBillingAddressSuggestions(value.length >= 3);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  const handleAddressSelect = (address: string, isBilling = false) => {
    const parts = address.split(', ');
    const lastPart = parts[parts.length - 1];
    const [postalCode, ...cityParts] = lastPart.split(' ');
    
    if (isBilling) {
      setFormData({
        ...formData,
        billingAddress1: parts[0],
        billingPostalCode: postalCode || formData.billingPostalCode,
        billingCity: cityParts.join(' ') || formData.billingCity,
      });
      setShowBillingAddressSuggestions(false);
      setBillingAddressQuery(parts[0]);
    } else {
      setFormData({
        ...formData,
        address1: parts[0],
        postalCode: postalCode || formData.postalCode,
        city: cityParts.join(' ') || formData.city,
      });
      setShowAddressSuggestions(false);
      setAddressQuery(parts[0]);
    }
  };

  // Validation renforcée du mot de passe
  const validatePassword = (password: string) => {
    const validations = [
      { test: password.length >= 6, message: "Le mot de passe doit contenir au moins 6 caractères" },
      { test: /[A-Z]/.test(password), message: "Le mot de passe doit contenir au moins une majuscule" },
      { test: /[0-9]/.test(password), message: "Le mot de passe doit contenir au moins un chiffre" },
      { test: /[^A-Za-z0-9]/.test(password), message: "Le mot de passe doit contenir au moins un caractère spécial" },
    ];

    const failedValidation = validations.find(v => !v.test);
    return failedValidation ? failedValidation.message : null;
  };

  const goToNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  };

  const validateCurrentTab = () => {
    switch (activeTab) {
      case "personal":
        if (!formData.firstName.trim()) {
          toast.error("Le prénom est requis");
          return false;
        }
        if (!formData.lastName.trim()) {
          toast.error("Le nom est requis");
          return false;
        }
        if (!formData.birthPlace.trim()) {
          toast.error("Le lieu de naissance est requis");
          return false;
        }
        return true;
        
      case "address":
        if (!formData.address1.trim()) {
          toast.error("L&apos;adresse est requise");
          return false;
        }
        if (!formData.postalCode.trim()) {
          toast.error("Le code postal est requis");
          return false;
        }
        if (!formData.city.trim()) {
          toast.error("La ville est requise");
          return false;
        }
        if (!formData.phone1.trim()) {
          toast.error("Le téléphone est requis");
          return false;
        }
        return true;

      case "billing":
        if (!formData.useSameAddressForBilling) {
          if (!formData.billingAddress1.trim()) {
            toast.error("L&apos;adresse de facturation est requise");
            return false;
          }
          if (!formData.billingPostalCode.trim()) {
            toast.error("Le code postal de facturation est requis");
            return false;
          }
          if (!formData.billingCity.trim()) {
            toast.error("La ville de facturation est requise");
            return false;
          }
        }
        return true;
        
      case "permit":
        if (!formData.permitNumber.trim()) {
          toast.error("Le numéro de permis est requis");
          return false;
        }
        if (!formData.permitIssuedAt.trim()) {
          toast.error("Le lieu de délivrance du permis est requis");
          return false;
        }
        return true;
        
      case "account":
        if (!formData.email.trim()) {
          toast.error("L&apos;email est requis");
          return false;
        }
        if (!formData.email.includes('@')) {
          toast.error("Veuillez entrer un email valide");
          return false;
        }
        if (!formData.username.trim()) {
          toast.error("Le nom d&apos;utilisateur est requis");
          return false;
        }
        
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          toast.error(passwordError);
          return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast.error("Les mots de passe ne correspondent pas");
          return false;
        }
        return true;

      // ✅ SUPPRIMÉ le cas "terms"
        
      default:
        return true;
    }
  };

  const handleNextClick = () => {
    if (validateCurrentTab()) {
      goToNextTab();
    }
  };

  // ✅ MODIFIÉ : handleSubmit reste identique
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateCurrentTab()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        birthDate: formData.birthDate.toISOString(),
        permitDate: formData.permitDate.toISOString(),
      };

      // ✅ ÉTAPE 1: INSCRIPTION
      toast.loading('Création de votre compte...', { id: 'inscription' });
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Échec de l\'inscription', { id: 'inscription' });
        setIsSubmitting(false);
        return;
      }

      toast.success('Compte créé avec succès !', { id: 'inscription' });

      // ✅ ÉTAPE 2: CONNEXION AUTOMATIQUE IMMÉDIATE
      toast.loading('Connexion automatique...', { id: 'connexion' });
      
      const loginResult = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        console.error('Erreur de connexion:', loginResult.error);
        // ✅ Réessayer une fois après un délai
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryLogin = await signIn('credentials', {
          username: formData.username,
          password: formData.password,
          redirect: false,
        });
        
        if (retryLogin?.error) {
          toast.error('Erreur de connexion automatique', { id: 'connexion' });
          setIsSubmitting(false);
          return;
        }
      }

      toast.success('Connexion réussie !', { id: 'connexion' });

      // ✅ ÉTAPE 3: REDIRECTION VERS PAGE D'ATTENTE
      toast.loading('Préparation de votre espace...', { id: 'redirect' });
      
      // Construire l'URL avec callback
      const params = new URLSearchParams();
      if (callbackUrl) {
        params.set('target', callbackUrl);
      }
      
      const waitingUrl = `/waiting-redirect?${params.toString()}`;
      
      // ✅ Petit délai puis redirection
      setTimeout(() => {
        router.push(waitingUrl);
      }, 1000);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Échec de l'inscription");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Inscription à EG-Formation</h1>
        
        {/* Barre de progression MISE À JOUR pour 5 étapes */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Étapes MISES À JOUR (5 au lieu de 6) */}
        <div className="flex justify-between text-sm mb-8 px-1">
          <div className={`flex flex-col items-center ${tabIndex >= 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {tabIndex > 0 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
            </div>
            <span>Informations</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {tabIndex > 1 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
            </div>
            <span>Adresse</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {tabIndex > 2 ? <CheckCircle2 className="w-5 h-5" /> : "3"}
            </div>
            <span>Facturation</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {tabIndex > 3 ? <CheckCircle2 className="w-5 h-5" /> : "4"}
            </div>
            <span>Permis</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 4 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              "5"
            </div>
            <span>Compte</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Onglet 1: Informations personnelles */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>
                    Entrez vos informations personnelles pour votre inscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => handleSelectChange("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Homme</SelectItem>
                          <SelectItem value="female">Femme</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Date de naissance</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.birthDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.birthDate ? (
                              format(formData.birthDate, "PPP", {
                                locale: fr,
                              })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.birthDate}
                            onSelect={(date) => handleDateChange("birthDate", date)}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1930}
                            toYear={new Date().getFullYear()}
                            disabled={(date) => {
                              return date > new Date() || date < new Date("1900-01-01");
                            }}
                            defaultMonth={new Date(1990, 0)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Entrez votre nom"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Entrez votre prénom"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nom d&apos;usage <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Entrez votre nom d&apos;usage si différent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthPlace">Lieu de naissance</Label>
                      <Input
                        id="birthPlace"
                        name="birthPlace"
                        value={formData.birthPlace}
                        onChange={handleChange}
                        placeholder="Entrez votre lieu de naissance"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <CancelRegisterDialog /> 
                  <Button className="cursor-pointer" type="button" onClick={handleNextClick}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Onglet 2: Adresse et contact */}
            <TabsContent value="address">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Adresse et informations de contact
                  </CardTitle>
                  <CardDescription>
                    Fournissez votre adresse et vos coordonnées.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2 relative">
                      <Label htmlFor="address1">Adresse (ligne 1)</Label>
                      <Input
                        id="address1"
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        placeholder="Commencez à taper votre adresse..."
                        required
                        onFocus={() => setShowAddressSuggestions(addressQuery.length >= 3)}
                        onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                      />
                      
                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {isLoadingAddresses && (
                            <div className="p-3 text-center text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                              Recherche d&apos;adresses...
                            </div>
                          )}
                          {addressSuggestions.map((address, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => handleAddressSelect(address)}
                            >
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{address}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address2">Adresse (ligne 2) <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="address2"
                        name="address2"
                        value={formData.address2 || ""}
                        onChange={handleChange}
                        placeholder="Complément d&apos;adresse"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address3">Complément d&apos;adresse <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="address3"
                        name="address3"
                        value={formData.address3 || ""}
                        onChange={handleChange}
                        placeholder="Bâtiment, résidence, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Code postal"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Ville"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Pays</Label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryOpen}
                            className="w-full justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              {formData.country ? 
                                COUNTRIES.find(country => country.code === formData.country)?.name :
                                "Sélectionnez un pays"
                              }
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher un pays..." />
                            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      handleSelectChange("country", country.code);
                                      setCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.country === country.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone1">Téléphone principal</Label>
                      <Input
                        id="phone1"
                        name="phone1"
                        value={formData.phone1}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Téléphone principal"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone2">Téléphone secondaire <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="phone2"
                        name="phone2"
                        value={formData.phone2 || ""}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Téléphone secondaire"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={handleNextClick}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Onglet 3: Adresse de facturation */}
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Adresse de facturation
                  </CardTitle>
                  <CardDescription>
                    Définissez l&apos;adresse qui apparaîtra sur vos factures.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="useSameAddressForBilling" 
                        checked={formData.useSameAddressForBilling}
                        onCheckedChange={(checked) => setFormData({...formData, useSameAddressForBilling: checked === true})}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="useSameAddressForBilling"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Utiliser la même adresse que l&apos;adresse de domicile pour la facturation
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Si vous cochez cette case, votre adresse de domicile sera utilisée pour la facturation.
                        </p>
                      </div>
                    </div>

                    {!formData.useSameAddressForBilling && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
                        <div className="space-y-2 md:col-span-2 relative">
                          <Label htmlFor="billingAddress1">Adresse de facturation (ligne 1)</Label>
                          <Input
                            id="billingAddress1"
                            name="billingAddress1"
                            value={formData.billingAddress1}
                            onChange={handleChange}
                            placeholder="Commencez à taper votre adresse de facturation..."
                            required={!formData.useSameAddressForBilling}
                            onFocus={() => setShowBillingAddressSuggestions(billingAddressQuery.length >= 3)}
                            onBlur={() => setTimeout(() => setShowBillingAddressSuggestions(false), 200)}
                          />
                          
                          {showBillingAddressSuggestions && billingAddressSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {isLoadingBillingAddresses && (
                                <div className="p-3 text-center text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                                  Recherche d&apos;adresses...
                                </div>
                              )}
                              {billingAddressSuggestions.map((address, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-2"
                                  onClick={() => handleAddressSelect(address, true)}
                                >
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{address}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="billingAddress2">Adresse de facturation (ligne 2) <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                          <Input
                            id="billingAddress2"
                            name="billingAddress2"
                            value={formData.billingAddress2 || ""}
                            onChange={handleChange}
                            placeholder="Complément d&apos;adresse de facturation"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="billingAddress3">Complément d&apos;adresse de facturation <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                          <Input
                            id="billingAddress3"
                            name="billingAddress3"
                            value={formData.billingAddress3 || ""}
                            onChange={handleChange}
                            placeholder="Bâtiment, résidence, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingPostalCode">Code postal de facturation</Label>
                          <Input
                            id="billingPostalCode"
                            name="billingPostalCode"
                            value={formData.billingPostalCode}
                            onChange={handleChange}
                            placeholder="Code postal"
                            required={!formData.useSameAddressForBilling}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingCity">Ville de facturation</Label>
                          <Input
                            id="billingCity"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleChange}
                            placeholder="Ville"
                            required={!formData.useSameAddressForBilling}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Pays de facturation</Label>
                          <Popover open={billingCountryOpen} onOpenChange={setBillingCountryOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={billingCountryOpen}
                                className="w-full justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  {formData.billingCountry ? 
                                    COUNTRIES.find(country => country.code === formData.billingCountry)?.name :
                                    "Sélectionnez un pays"
                                  }
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Rechercher un pays..." />
                                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {COUNTRIES.map((country) => (
                                      <CommandItem
                                        key={country.code}
                                        value={country.name}
                                        onSelect={() => {
                                          handleSelectChange("billingCountry", country.code);
                                          setBillingCountryOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.billingCountry === country.code ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {country.name}
                                      </CommandItem>
                                    ))}
                                  </CommandList>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={handleNextClick}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Onglet 4: Permis de conduire */}
            <TabsContent value="permit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Informations sur le permis de conduire
                  </CardTitle>
                  <CardDescription>
                    Détails concernant votre permis de conduire.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="permitNumber">Numéro de permis</Label>
                      <Input
                        id="permitNumber"
                        name="permitNumber"
                        value={formData.permitNumber}
                        onChange={handleChange}
                        placeholder="Numéro de permis de conduire"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permitIssuedAt">Délivré par</Label>
                      <Input
                        id="permitIssuedAt"
                        name="permitIssuedAt"
                        value={formData.permitIssuedAt}
                        onChange={handleChange}
                        placeholder="Autorité ayant délivré le permis"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="permitDate">Date d&apos;obtention</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.permitDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.permitDate ? (
                              format(formData.permitDate, "PPP", {
                                locale: fr,
                              })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.permitDate}
                            onSelect={(date) => handleDateChange("permitDate", date)}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1970}
                            toYear={2025}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={handleNextClick}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ✅ MODIFIÉ : Onglet 5 final - Compte utilisateur avec soumission */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Créer votre compte
                  </CardTitle>
                  <CardDescription>
                    Définissez vos identifiants de connexion et finalisez votre inscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Adresse e-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="votre.email@exemple.com"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choisissez un nom d&apos;utilisateur"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          type={showPassword ? "text" : "password"}
                          placeholder="Choisissez un mot de passe sécurisé"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {formData.password && <PasswordValidator password={formData.password} />}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmez votre mot de passe"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Les mots de passe ne correspondent pas</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ NOUVEAU : Section des conditions générales intégrée */}

                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Finaliser l&apos;inscription
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
      
      <Footer />
    </div>
  );
}

// ✅ Composant principal avec Suspense boundary
export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container max-w-5xl mx-auto py-10 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du formulaire d&apos;inscription...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}