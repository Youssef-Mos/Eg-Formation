"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CalendarIcon, Loader2, Save, User, MapPin, Phone, Car } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ProfilePro() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    phone1: "",
    phone2: "",
    permitNumber: "",
    permitIssuedAt: "",
    permitDate: new Date(),
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
          
          // Convertir les chaînes de date en objets Date
          const userDataWithDates = {
            ...userData,
            birthDate: userData.birthDate ? new Date(userData.birthDate) : new Date(),
            permitDate: userData.permitDate ? new Date(userData.permitDate) : new Date(),
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
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
      // If you want to compare with the username instead of name
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

      <Tabs defaultValue="personal" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Informations personnelles</span>
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Adresse et contact</span>
          </TabsTrigger>
          <TabsTrigger value="permit" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span>Permis de conduire</span>
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