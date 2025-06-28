"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Search, 
  Eye, 
  Users, 
  FileText, 
  Mail, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Car,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Download,
  Send,
  Plus,
  CalendarIcon,
  Loader2,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone1: string;
  phone2?: string;
  address1: string;
  address2?: string;
  address3?: string;
  postalCode: string;
  city: string;
  country: string;
  birthDate: string;
  birthPlace: string;
  permitNumber: string;
  permitIssuedAt: string;
  permitDate: string;
  permitDocumentUploaded: boolean;
  permitDocumentVerified: boolean;
  profileCompleted: boolean;
  useSameAddressForBilling: boolean;
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddress3?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingCountry?: string;
  createdAt: string;
  reservations: Array<{
    id: number;
    createdAt: string;
    paid: boolean;
    stage: {
      Titre: string;
      DateDebut: string;
      DateFin: string;
      Prix: number;
    };
  }>;
  permitDocuments: Array<{
    id: number;
    fileName: string;
    status: string;
    createdAt: string;
  }>;
}

// Interface pour les statistiques
interface ApiStats {
  totalClients: number;
  completeProfiles: number;
  incompleteProfiles: number;
  uploadedDocuments: number;
  verifiedDocuments: number;
  unverifiedDocuments: number;
}

// Interface pour la réponse API
interface ApiResponse {
  clients: Client[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  stats: ApiStats;
}

// Interface pour le nouveau client avec dates séparées
interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthPlace: string;
  address1: string;
  address2: string;
  address3: string;
  postalCode: string;
  city: string;
  country: string;
  phone1: string;
  phone2: string;
  permitNumber: string;
  permitIssuedAt: string;
  permitDay: string;
  permitMonth: string;
  permitYear: string;
  useSameAddressForBilling: boolean;
  billingAddress1: string;
  billingAddress2: string;
  billingAddress3: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
}

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

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

// Composant pour sélectionner le jour avec recherche
const DaySelector = ({ value, onChange, placeholder = "Jour" }: {
  value: string;
  onChange: (day: string) => void;
  placeholder?: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Générer la liste des jours
  const days = [];
  for (let day = 1; day <= 31; day++) {
    days.push(day.toString().padStart(2, '0'));
  }

  // Filtrer les jours basés sur la recherche
  const filteredDays = searchTerm 
    ? days.filter(day => day.includes(searchTerm) || day.startsWith(searchTerm))
    : days;

  return (
    <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Tapez un chiffre (ex: 1, 15...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredDays.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};

// Composant pour sélectionner l'année avec recherche
const YearSelector = ({ value, onChange, placeholder = "Année", minYear = 1930, maxYear = new Date().getFullYear() }: {
  value: string;
  onChange: (year: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Générer la liste des années
  const years = [];
  for (let year = maxYear; year >= minYear; year--) {
    years.push(year.toString());
  }

  // Filtrer les années basées sur la recherche
  const filteredYears = searchTerm 
    ? years.filter(year => year.includes(searchTerm))
    : years;

  return (
    <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Tapez pour rechercher (ex: 19, 196...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};

export default function ClientProfiles() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [stats, setStats] = useState<ApiStats>({
    totalClients: 0,
    completeProfiles: 0,
    incompleteProfiles: 0,
    uploadedDocuments: 0,
    verifiedDocuments: 0,
    unverifiedDocuments: 0
  });

  // États pour l'ajout de client
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    gender: "male",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
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
    permitDay: "",
    permitMonth: "",
    permitYear: "",
    useSameAddressForBilling: true,
    billingAddress1: "",
    billingAddress2: "",
    billingAddress3: "",
    billingPostalCode: "",
    billingCity: "",
    billingCountry: "FR"
  });

  // Vérifier que l'utilisateur est admin
  if (session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Vous n'avez pas les droits pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Charger les clients
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      
      const data: ApiResponse = await res.json();
      
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
      setStats(data.stats || {
        totalClients: 0,
        completeProfiles: 0,
        incompleteProfiles: 0,
        uploadedDocuments: 0,
        verifiedDocuments: 0,
        unverifiedDocuments: 0
      });
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les clients");
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des clients
  useEffect(() => {
    if (!Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }

    const filtered = clients.filter(client => 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Gestion du formulaire de nouveau client
  const handleNewClientChange = (field: keyof NewClientForm, value: any) => {
    setNewClientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour valider et créer une date
  const createDateFromFields = (day: string, month: string, year: string): Date | null => {
    if (!day || !month || !year) return null;
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Vérifier que la date est valide
    if (date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
      return null;
    }
    
    return date;
  };

  // Créer un nouveau client
  const createNewClient = async () => {
    // Validation des champs requis
    const requiredFields = [
      'firstName', 'lastName', 'email', 'username', 'birthPlace',
      'address1', 'postalCode', 'city', 'phone1', 'permitNumber', 'permitIssuedAt',
      'birthDay', 'birthMonth', 'birthYear', 'permitDay', 'permitMonth', 'permitYear'
    ];

    for (const field of requiredFields) {
      if (!newClientForm[field as keyof NewClientForm]) {
        toast.error(`Le champ ${field} est requis`);
        return;
      }
    }

    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientForm.email)) {
      toast.error("Adresse email invalide");
      return;
    }

    // Validation des dates
    const birthDate = createDateFromFields(newClientForm.birthDay, newClientForm.birthMonth, newClientForm.birthYear);
    if (!birthDate) {
      toast.error("Date de naissance invalide");
      return;
    }

    const permitDate = createDateFromFields(newClientForm.permitDay, newClientForm.permitMonth, newClientForm.permitYear);
    if (!permitDate) {
      toast.error("Date du permis invalide");
      return;
    }

    // Validation adresse de facturation si nécessaire
    if (!newClientForm.useSameAddressForBilling) {
      if (!newClientForm.billingAddress1 || !newClientForm.billingPostalCode || !newClientForm.billingCity) {
        toast.error("Adresse de facturation incomplète");
        return;
      }
    }

    setCreatingClient(true);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newClientForm,
          birthDate: birthDate.toISOString(),
          permitDate: permitDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const result = await res.json();
      
      toast.success("Client créé avec succès !");
      
      // Afficher le mot de passe temporaire
      setTempPassword(result.tempPassword);
      setNewClientEmail(result.client.email);
      setTempPasswordDialogOpen(true);
      
      // Fermer le dialog de création
      setAddClientDialogOpen(false);
      
      // Réinitialiser le formulaire
      setNewClientForm({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        gender: "male",
        birthDay: "",
        birthMonth: "",
        birthYear: "",
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
        permitDay: "",
        permitMonth: "",
        permitYear: "",
        useSameAddressForBilling: true,
        billingAddress1: "",
        billingAddress2: "",
        billingAddress3: "",
        billingPostalCode: "",
        billingCity: "",
        billingCountry: "FR"
      });
      
      // Recharger la liste des clients
      fetchClients();
      
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || "Impossible de créer le client");
    } finally {
      setCreatingClient(false);
    }
  };

  // Copier le mot de passe
  const copyTempPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast.success("Mot de passe copié dans le presse-papiers");
  };

  // Envoyer une notification de rappel pour le permis
  const sendPermitReminder = async (clientId: number) => {
    setSendingNotification(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/permit-reminder`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      
      toast.success("Notification envoyée avec succès");
      
      // Mettre à jour les données du client
      const updatedClients = clients.map(client => 
        client.id === clientId 
          ? { ...client, permitNotificationSent: new Date().toISOString() }
          : client
      );
      setClients(updatedClients);
      setFilteredClients(updatedClients);
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible d'envoyer la notification");
    } finally {
      setSendingNotification(false);
    }
  };

  // Télécharger le document de permis
  const downloadPermitDocument = async (documentId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/admin/permit-documents/${documentId}/download`);
      if (!res.ok) throw new Error("Erreur lors du téléchargement");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de télécharger le document");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Vérifié</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find(country => country.code === code)?.name || code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement des profils clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Gestion des profils clients
              </CardTitle>
              <CardDescription>
                Gérez et consultez les profils de tous vos clients
              </CardDescription>
            </div>
            {/* Bouton d'ajout de client */}
            <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau client</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un compte client. Un mot de passe temporaire sera généré.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Informations</TabsTrigger>
                    <TabsTrigger value="address">Adresse</TabsTrigger>
                    <TabsTrigger value="billing">Facturation</TabsTrigger>
                    <TabsTrigger value="permit">Permis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          value={newClientForm.firstName}
                          onChange={(e) => handleNewClientChange('firstName', e.target.value)}
                          placeholder="Prénom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          value={newClientForm.lastName}
                          onChange={(e) => handleNewClientChange('lastName', e.target.value)}
                          placeholder="Nom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) => handleNewClientChange('email', e.target.value)}
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Nom d'utilisateur *</Label>
                        <Input
                          id="username"
                          value={newClientForm.username}
                          onChange={(e) => handleNewClientChange('username', e.target.value)}
                          placeholder="nom_utilisateur"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select 
                          value={newClientForm.gender} 
                          onValueChange={(value) => handleNewClientChange('gender', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Homme</SelectItem>
                            <SelectItem value="female">Femme</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de naissance *</Label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="min-w-0">
                            <DaySelector
                              value={newClientForm.birthDay}
                              onChange={(value) => handleNewClientChange('birthDay', value)}
                              placeholder="Jour"
                            />
                          </div>
                          <div className="min-w-0">
                            <Select 
                              value={newClientForm.birthMonth} 
                              onValueChange={(value) => handleNewClientChange('birthMonth', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Mois" />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((month) => (
                                  <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="min-w-0">
                            <YearSelector
                              value={newClientForm.birthYear}
                              onChange={(value) => handleNewClientChange('birthYear', value)}
                              placeholder="Année"
                              minYear={1930}
                              maxYear={2010}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="birthPlace">Lieu de naissance *</Label>
                        <Input
                          id="birthPlace"
                          value={newClientForm.birthPlace}
                          onChange={(e) => handleNewClientChange('birthPlace', e.target.value)}
                          placeholder="Lieu de naissance"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address1">Adresse *</Label>
                        <Input
                          id="address1"
                          value={newClientForm.address1}
                          onChange={(e) => handleNewClientChange('address1', e.target.value)}
                          placeholder="Adresse principale"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address2">Complément d'adresse</Label>
                        <Input
                          id="address2"
                          value={newClientForm.address2}
                          onChange={(e) => handleNewClientChange('address2', e.target.value)}
                          placeholder="Complément d'adresse"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal *</Label>
                        <Input
                          id="postalCode"
                          value={newClientForm.postalCode}
                          onChange={(e) => handleNewClientChange('postalCode', e.target.value)}
                          placeholder="Code postal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={newClientForm.city}
                          onChange={(e) => handleNewClientChange('city', e.target.value)}
                          placeholder="Ville"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Select 
                          value={newClientForm.country} 
                          onValueChange={(value) => handleNewClientChange('country', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone1">Téléphone *</Label>
                        <Input
                          id="phone1"
                          value={newClientForm.phone1}
                          onChange={(e) => handleNewClientChange('phone1', e.target.value)}
                          placeholder="Téléphone principal"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="billing" className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="useSameAddressForBilling"
                        checked={newClientForm.useSameAddressForBilling}
                        onCheckedChange={(checked) => handleNewClientChange('useSameAddressForBilling', checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="useSameAddressForBilling" className="text-sm font-medium">
                          Utiliser la même adresse pour la facturation
                        </label>
                      </div>
                    </div>

                    {!newClientForm.useSameAddressForBilling && (
                      <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="billingAddress1">Adresse de facturation *</Label>
                          <Input
                            id="billingAddress1"
                            value={newClientForm.billingAddress1}
                            onChange={(e) => handleNewClientChange('billingAddress1', e.target.value)}
                            placeholder="Adresse de facturation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingPostalCode">Code postal *</Label>
                          <Input
                            id="billingPostalCode"
                            value={newClientForm.billingPostalCode}
                            onChange={(e) => handleNewClientChange('billingPostalCode', e.target.value)}
                            placeholder="Code postal"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingCity">Ville *</Label>
                          <Input
                            id="billingCity"
                            value={newClientForm.billingCity}
                            onChange={(e) => handleNewClientChange('billingCity', e.target.value)}
                            placeholder="Ville"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="permit" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="permitNumber">Numéro de permis *</Label>
                        <Input
                          id="permitNumber"
                          value={newClientForm.permitNumber}
                          onChange={(e) => handleNewClientChange('permitNumber', e.target.value)}
                          placeholder="Numéro de permis"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permitIssuedAt">Délivré par *</Label>
                        <Input
                          id="permitIssuedAt"
                          value={newClientForm.permitIssuedAt}
                          onChange={(e) => handleNewClientChange('permitIssuedAt', e.target.value)}
                          placeholder="Autorité de délivrance"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Date d'obtention du permis *</Label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="min-w-0">
                            <DaySelector
                              value={newClientForm.permitDay}
                              onChange={(value) => handleNewClientChange('permitDay', value)}
                              placeholder="Jour"
                            />
                          </div>
                          <div className="min-w-0">
                            <Select 
                              value={newClientForm.permitMonth} 
                              onValueChange={(value) => handleNewClientChange('permitMonth', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Mois" />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((month) => (
                                  <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="min-w-0">
                            <YearSelector
                              value={newClientForm.permitYear}
                              onChange={(value) => handleNewClientChange('permitYear', value)}
                              placeholder="Année"
                              minYear={1970}
                              maxYear={new Date().getFullYear()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setAddClientDialogOpen(false)}
                    disabled={creatingClient}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={createNewClient}
                    disabled={creatingClient}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {creatingClient ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer le client
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total clients</p>
                    <p className="text-2xl font-bold">{stats.totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Profils complets</p>
                    <p className="text-2xl font-bold">{stats.completeProfiles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Permis téléchargés</p>
                    <p className="text-2xl font-bold">{stats.uploadedDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Permis manquants</p>
                    <p className="text-2xl font-bold">{stats.unverifiedDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des clients */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Permis</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-gray-500">@{client.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {client.permitDocumentUploaded ? (
                          <Badge className="bg-green-100 text-green-800 w-fit">
                            Téléchargé
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 w-fit">
                            Manquant
                          </Badge>
                        )}
                        {client.permitDocumentVerified && (
                          <Badge className="bg-blue-100 text-blue-800 w-fit">
                            Vérifié
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.profileCompleted ? (
                        <Badge className="bg-green-100 text-green-800">Complet</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Incomplet</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={dialogOpen && selectedClient?.id === client.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedClient(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Profil de {client.firstName} {client.lastName}
                              </DialogTitle>
                              <DialogDescription>
                                Informations détaillées du client
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedClient && (
                              <Tabs defaultValue="info" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="info">Informations</TabsTrigger>
                                  <TabsTrigger value="address">Adresses</TabsTrigger>
                                  <TabsTrigger value="permit">Permis</TabsTrigger>
                                  <TabsTrigger value="reservations">Réservations</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="info" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Prénom</label>
                                      <p className="text-sm text-gray-600">{selectedClient.firstName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Nom</label>
                                      <p className="text-sm text-gray-600">{selectedClient.lastName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p className="text-sm text-gray-600">{selectedClient.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Nom d'utilisateur</label>
                                      <p className="text-sm text-gray-600">{selectedClient.username}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Date de naissance</label>
                                      <p className="text-sm text-gray-600">
                                        {format(new Date(selectedClient.birthDate), "dd/MM/yyyy", { locale: fr })}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Lieu de naissance</label>
                                      <p className="text-sm text-gray-600">{selectedClient.birthPlace}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Téléphone principal</label>
                                      <p className="text-sm text-gray-600">{selectedClient.phone1}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Téléphone secondaire</label>
                                      <p className="text-sm text-gray-600">{selectedClient.phone2 || "Non renseigné"}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="address" className="space-y-4">
                                  <div>
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      Adresse de domicile
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p>{selectedClient.address1}</p>
                                      {selectedClient.address2 && <p>{selectedClient.address2}</p>}
                                      {selectedClient.address3 && <p>{selectedClient.address3}</p>}
                                      <p>{selectedClient.postalCode} {selectedClient.city}</p>
                                      <p>{getCountryName(selectedClient.country)}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                      <CreditCard className="w-4 h-4" />
                                      Adresse de facturation
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      {selectedClient.useSameAddressForBilling ? (
                                        <p className="text-sm text-gray-600">
                                          Identique à l'adresse de domicile
                                        </p>
                                      ) : (
                                        <>
                                          <p>{selectedClient.billingAddress1}</p>
                                          {selectedClient.billingAddress2 && <p>{selectedClient.billingAddress2}</p>}
                                          {selectedClient.billingAddress3 && <p>{selectedClient.billingAddress3}</p>}
                                          <p>{selectedClient.billingPostalCode} {selectedClient.billingCity}</p>
                                          <p>{selectedClient.billingCountry && getCountryName(selectedClient.billingCountry)}</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="permit" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Numéro de permis</label>
                                      <p className="text-sm text-gray-600">{selectedClient.permitNumber}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Délivré par</label>
                                      <p className="text-sm text-gray-600">{selectedClient.permitIssuedAt}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Date d'obtention</label>
                                      <p className="text-sm text-gray-600">
                                        {format(new Date(selectedClient.permitDate), "dd/MM/yyyy", { locale: fr })}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Document téléchargé</label>
                                      <p className="text-sm text-gray-600">
                                        {selectedClient.permitDocumentUploaded ? "Oui" : "Non"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {selectedClient.permitDocuments.length > 0 && (
                                    <div>
                                      <h3 className="font-medium mb-2">Documents de permis</h3>
                                      <div className="space-y-2">
                                        {selectedClient.permitDocuments.map((doc) => (
                                          <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                              <FileText className="w-4 h-4" />
                                              <span className="text-sm">{doc.fileName}</span>
                                              {getStatusBadge(doc.status)}
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => downloadPermitDocument(doc.id, doc.fileName)}
                                            >
                                              <Download className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!selectedClient.permitDocumentUploaded && (
                                    <Button
                                      onClick={() => sendPermitReminder(selectedClient.id)}
                                      disabled={sendingNotification}
                                      className="w-full"
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      {sendingNotification ? "Envoi en cours..." : "Envoyer un rappel par email"}
                                    </Button>
                                  )}
                                </TabsContent>
                                
                                <TabsContent value="reservations" className="space-y-4">
                                  {selectedClient.reservations.length > 0 ? (
                                    <div className="space-y-2">
                                      {selectedClient.reservations.map((reservation) => (
                                        <div key={reservation.id} className="border rounded-lg p-3">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <h4 className="font-medium">{reservation.stage.Titre}</h4>
                                              <p className="text-sm text-gray-600">
                                                Du {format(new Date(reservation.stage.DateDebut), "dd/MM/yyyy", { locale: fr })} au {format(new Date(reservation.stage.DateFin), "dd/MM/yyyy", { locale: fr })}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                Réservé le {format(new Date(reservation.createdAt), "dd/MM/yyyy", { locale: fr })}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">{reservation.stage.Prix}€</p>
                                              {reservation.paid ? (
                                                <Badge className="bg-green-100 text-green-800">Payé</Badge>
                                              ) : (
                                                <Badge className="bg-red-100 text-red-800">Non payé</Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-center text-gray-500">Aucune réservation</p>
                                  )}
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {!client.permitDocumentUploaded && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendPermitReminder(client.id)}
                            disabled={sendingNotification}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun client trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour afficher le mot de passe temporaire */}
      <AlertDialog open={tempPasswordDialogOpen} onOpenChange={setTempPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Client créé avec succès !
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Le compte pour <strong>{newClientEmail}</strong> a été créé avec succès.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Mot de passe temporaire :</h4>
                  <div className="flex items-center gap-2 bg-white p-2 rounded border">
                    <code className="flex-1 font-mono text-lg">{tempPassword}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTempPassword}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    ⚠️ <strong>Important :</strong> Communiquez ce mot de passe au client de manière sécurisée. 
                    Il devra le changer lors de sa première connexion.
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Email :</strong> {newClientEmail}</p>
                  <p><strong>Mot de passe :</strong> {tempPassword}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setTempPasswordDialogOpen(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}