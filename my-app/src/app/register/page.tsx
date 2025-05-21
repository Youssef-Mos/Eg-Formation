'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Nav from "@/components/nav";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, User, MapPin, Car, Save, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  // État actif pour la navigation et la barre de progression
  const [activeTab, setActiveTab] = useState("personal");
  const tabs = ["personal", "address", "permit", "account", "terms"];
  const tabIndex = tabs.indexOf(activeTab);
  const progress = ((tabIndex + 1) / tabs.length) * 100;
  
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
    phone1: '',
    phone2: '',
    email: '',
    permitNumber: '',
    permitIssuedAt: '',
    permitDate: new Date(),
    username: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptRules: false, // Nouveau champ pour le règlement intérieur
    confirmPointsCheck: false, // Nouveau champ pour la vérification des points
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
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
          toast.error("L'adresse est requise");
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
          toast.error("L'email est requis");
          return false;
        }
        if (!formData.email.includes('@')) {
          toast.error("Veuillez entrer un email valide");
          return false;
        }
        if (!formData.username.trim()) {
          toast.error("Le nom d'utilisateur est requis");
          return false;
        }
        if (formData.password.length < 6) {
          toast.error("Le mot de passe doit contenir au moins 6 caractères");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Les mots de passe ne correspondent pas");
          return false;
        }
        return true;

      case "terms":
        if (!formData.acceptTerms) {
          toast.error("Vous devez accepter les conditions générales d'utilisation");
          return false;
        }
        if (!formData.acceptRules) {
          toast.error("Vous devez accepter le règlement intérieur");
          return false;
        }
        if (!formData.confirmPointsCheck) {
          toast.error("Vous devez confirmer avoir vérifié votre solde de points");
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNextClick = () => {
    if (validateCurrentTab()) {
      goToNextTab();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateCurrentTab()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Conversion des dates en ISO string
      const dataToSend = {
        ...formData,
        birthDate: formData.birthDate.toISOString(),
        permitDate: formData.permitDate.toISOString(),
      };
  
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        toast.error(result.error || 'Échec de l\'inscription');
        setIsSubmitting(false);
        return;
      }
  
      toast.success('Inscription réussie !');
  
      // Connexion automatique après inscription
      const loginResult = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false, // Nous gérons la redirection manuellement
      });
  
      if (loginResult?.error) {
        toast.error('Erreur lors de la connexion automatique.');
      } else {
        // Redirige vers la page souhaitée
        router.push(callbackUrl ? callbackUrl : '/');
      }
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
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Étapes sous forme de texte */}
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
            <span>Permis</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {tabIndex > 3 ? <CheckCircle2 className="w-5 h-5" /> : "4"}
            </div>
            <span>Compte</span>
          </div>
          <div className={`flex flex-col items-center ${tabIndex >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${tabIndex >= 4 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              "5"
            </div>
            <span>Conditions</span>
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
                            toYear={2010}
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
                      <Label htmlFor="name">Nom d'usage <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Entrez votre nom d'usage si différent"
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
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={handleNextClick}>
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address1">Adresse (ligne 1)</Label>
                      <Input
                        id="address1"
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        placeholder="Numéro et nom de rue"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address2">Adresse (ligne 2) <span className="text-gray-500 text-sm">(optionnel)</span></Label>
                      <Input
                        id="address2"
                        name="address2"
                        value={formData.address2 || ""}
                        onChange={handleChange}
                        placeholder="Complément d'adresse"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address3">Complément d'adresse <span className="text-gray-500 text-sm">(optionnel)</span></Label>
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

            {/* Onglet 3: Permis de conduire */}
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
                      <Label htmlFor="permitDate">Date d'obtention</Label>
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

            {/* Onglet 4: Compte utilisateur */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Créer votre compte
                  </CardTitle>
                  <CardDescription>
                    Définissez vos identifiants de connexion.
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
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choisissez un nom d'utilisateur"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        placeholder="Choisissez un mot de passe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        required
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

            {/* Onglet 5: Conditions générales */}
            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>Conditions et vérifications</CardTitle>
                  <CardDescription>
                    Veuillez lire et accepter les conditions pour finaliser votre inscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="acceptTerms" 
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked === true})}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Le stagiaire déclare adhérer aux conditions générales d'inscription d'EG-FORMATIONS
                        </label>
                        <div className="text-sm text-muted-foreground">
                        Consultez les{" "}
                        <LinkPreview url="http://localhost:3000/register/CGU" className="font-medium text-blue-600 hover:underline">
                          Conditions Générales d'Utilisation (CGU)
                        </LinkPreview>
                      </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="acceptRules" 
                        checked={formData.acceptRules}
                        onCheckedChange={(checked) => setFormData({...formData, acceptRules: checked === true})}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="acceptRules"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Le stagiaire déclare avoir pris connaissance du règlement intérieur et en avoir compris tous les termes
                        </label>
                        <div className="text-sm text-muted-foreground">
                        Consultez le{" "}
                        <LinkPreview url="http://localhost:3000/register/reglement" className="font-medium text-blue-600 hover:underline">
                          Règlement intérieur
                        </LinkPreview>
                      </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="confirmPointsCheck" 
                        checked={formData.confirmPointsCheck}
                        onCheckedChange={(checked) => setFormData({...formData, confirmPointsCheck: checked === true})}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="confirmPointsCheck"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Le stagiaire déclare avoir pris connaissance de son solde de points (relevé d'information RII) et ne pas faire l'objet d'une invalidation de son permis de conduire
                        </label>
                        <div className="text-sm text-muted-foreground">
                        Consultez le{" "}
                        <LinkPreview url="http://localhost:3000/register/reglement" className="font-medium text-blue-600 hover:underline">
                          Règlement intérieur
                        </LinkPreview>
                      </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.acceptTerms || !formData.acceptRules || !formData.confirmPointsCheck}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Finaliser l'inscription
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