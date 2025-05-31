"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  CalendarIcon, 
  Loader2, 
  Save, 
  User, 
  MapPin, 
  Phone, 
  Car, 
  CreditCard,
  Check,
  ChevronsUpDown,
  Globe,
  Home,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

// ✅ NOUVEAU : Liste des pays
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

export default function ProfilePro() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [billingCountryOpen, setBillingCountryOpen] = useState(false);
  
  // ✅ MISE À JOUR : FormData avec nouveaux champs de facturation
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    gender: "male",
    birthDate: new Date(),
    birthPlace: "",
    address1: "",
    address2: "",
    address3: "",
    postalCode: "",
    city: "",
    country: "FR",
    phone1: "",
    phone2: "",
    permitNumber: "",
    permitIssuedAt: "",
    permitDate: new Date(),
    // ✅ NOUVEAUX CHAMPS DE FACTURATION
    useSameAddressForBilling: true,
    billingAddress1: "",
    billingAddress2: "",
    billingAddress3: "",
    billingPostalCode: "",
    billingCity: "",
    billingCountry: "FR",
  });

  // Rediriger si non connecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const res = await fetch(`/api/user/${session.user.id}`);
          if (!res.ok) throw new Error("Erreur lors du chargement des données");
          
          const userData = await res.json();
          
          // ✅ MISE À JOUR : Conversion avec nouveaux champs
          const userDataWithDates = {
            ...userData,
            birthDate: userData.birthDate ? new Date(userData.birthDate) : new Date(),
            permitDate: userData.permitDate ? new Date(userData.permitDate) : new Date(),
            // Valeurs par défaut pour les nouveaux champs
            useSameAddressForBilling: userData.useSameAddressForBilling ?? true,
            billingAddress1: userData.billingAddress1 || "",
            billingAddress2: userData.billingAddress2 || "",
            billingAddress3: userData.billingAddress3 || "",
            billingPostalCode: userData.billingPostalCode || "",
            billingCity: userData.billingCity || "",
            billingCountry: userData.billingCountry || "FR",
            country: userData.country || "FR",
          };
          
          setFormData(userDataWithDates);
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Impossible de charger vos informations");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [status, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // ✅ NOUVEAU : Gestion de la checkbox adresse de facturation
  const handleBillingAddressChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      useSameAddressForBilling: checked,
      // Si on coche "même adresse", on vide les champs de facturation
      ...(checked && {
        billingAddress1: "",
        billingAddress2: "",
        billingAddress3: "",
        billingPostalCode: "",
        billingCity: "",
        billingCountry: "FR",
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ NOUVELLE VALIDATION : Adresse de facturation
      if (!formData.useSameAddressForBilling) {
        const requiredBillingFields = ['billingAddress1', 'billingPostalCode', 'billingCity'];
        const missingField = requiredBillingFields.find(field => !formData[field as keyof typeof formData]);
        
        if (missingField) {
          toast.error(`Le champ ${missingField} est requis pour l'adresse de facturation`);
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/user/${session?.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la mise à jour");
      }

      // Mise à jour réussie
      toast.success("Profil mis à jour avec succès");
      
      // Mettre à jour la session avec le nouveau nom d'utilisateur si modifié
      const currentFullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (
        currentFullName !== (session?.user.username || "")
      ) {
        await update({
          ...session,
          user: {
            ...session?.user,
            username: currentFullName,
          },
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : "Impossible de mettre à jour votre profil"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-600">Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Mon Profil</h1>

      {/* ✅ MISE À JOUR : 4 onglets au lieu de 3 */}
      <Tabs defaultValue="personal" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Informations</span>
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Adresse</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Facturation</span>
          </TabsTrigger>
          <TabsTrigger value="permit" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Permis</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Modifiez vos informations de base utilisées pour votre profil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value: string) => handleSelectChange("gender", value)}
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
                    <Label>Date de naissance</Label>
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="birthPlace">Lieu de naissance</Label>
                    <Input
                      id="birthPlace"
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Adresse et contact</CardTitle>
                <CardDescription>
                  Modifiez vos coordonnées et informations de contact.
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
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address2">Adresse (ligne 2)</Label>
                    <Input
                      id="address2"
                      name="address2"
                      value={formData.address2 || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address3">Complément d'adresse</Label>
                    <Input
                      id="address3"
                      name="address3"
                      value={formData.address3 || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  {/* ✅ NOUVEAU : Sélecteur de pays */}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone2">Téléphone secondaire</Label>
                    <Input
                      id="phone2"
                      name="phone2"
                      value={formData.phone2 || ""}
                      onChange={handleChange}
                      type="tel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ NOUVEL ONGLET : Adresse de facturation */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Adresse de facturation
                </CardTitle>
                <CardDescription>
                  Définissez l'adresse qui apparaîtra sur vos factures.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Affichage de l'adresse de domicile */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Votre adresse de domicile :</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    {[formData.address1, formData.address2, formData.address3].filter(Boolean).join(', ')}
                    {formData.address1 && <br />}
                    {formData.postalCode} {formData.city}
                    {formData.country && formData.country !== 'FR' && (
                      <span>, {COUNTRIES.find(c => c.code === formData.country)?.name}</span>
                    )}
                  </p>
                </div>

                {/* Checkbox pour utiliser la même adresse */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="useSameAddressForBilling"
                    checked={formData.useSameAddressForBilling}
                    onCheckedChange={handleBillingAddressChange}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="useSameAddressForBilling"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Utiliser la même adresse que l'adresse de domicile pour la facturation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Si vous cochez cette case, votre adresse de domicile sera utilisée pour toutes les factures.
                    </p>
                  </div>
                </div>

                {/* Formulaire d'adresse de facturation */}
                {!formData.useSameAddressForBilling && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Adresse de facturation spécifique</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="billingAddress1">Adresse de facturation (ligne 1) *</Label>
                        <Input
                          id="billingAddress1"
                          name="billingAddress1"
                          value={formData.billingAddress1}
                          onChange={handleChange}
                          placeholder="Numéro et nom de rue"
                          required={!formData.useSameAddressForBilling}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="billingAddress2">Adresse de facturation (ligne 2)</Label>
                        <Input
                          id="billingAddress2"
                          name="billingAddress2"
                          value={formData.billingAddress2}
                          onChange={handleChange}
                          placeholder="Complément d'adresse"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="billingAddress3">Complément d'adresse de facturation</Label>
                        <Input
                          id="billingAddress3"
                          name="billingAddress3"
                          value={formData.billingAddress3}
                          onChange={handleChange}
                          placeholder="Bâtiment, résidence, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingPostalCode">Code postal de facturation *</Label>
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
                        <Label htmlFor="billingCity">Ville de facturation *</Label>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permit">
            <Card>
              <CardHeader>
                <CardTitle>Permis de conduire</CardTitle>
                <CardDescription>
                  Informations concernant votre permis de conduire.
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date d'obtention</Label>
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
                          toYear={2023}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="permitIssuedAt">Délivré par</Label>
                    <Input
                      id="permitIssuedAt"
                      name="permitIssuedAt"
                      value={formData.permitIssuedAt}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-8 flex justify-center">
            <Button 
              type="submit" 
              className="w-full max-w-xs"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}