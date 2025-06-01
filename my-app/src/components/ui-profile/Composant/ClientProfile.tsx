"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Send
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

// ✅ NOUVEAU : Interface pour les statistiques
interface ApiStats {
  totalClients: number;
  completeProfiles: number;
  incompleteProfiles: number;
  uploadedDocuments: number;
  verifiedDocuments: number;
  unverifiedDocuments: number;
}

// ✅ NOUVEAU : Interface pour la réponse API
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

export default function ClientProfiles() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  // ✅ NOUVEAU : État pour les statistiques
  const [stats, setStats] = useState<ApiStats>({
    totalClients: 0,
    completeProfiles: 0,
    incompleteProfiles: 0,
    uploadedDocuments: 0,
    verifiedDocuments: 0,
    unverifiedDocuments: 0
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

  // ✅ CORRIGÉ : Charger les clients avec gestion de la nouvelle structure API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/admin/clients");
        if (!res.ok) throw new Error("Erreur lors du chargement");
        
        const data: ApiResponse = await res.json();
        
        // ✅ CORRECTION : Accéder à la propriété clients du retour API
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
        // ✅ SÉCURITÉ : S'assurer que clients est un tableau même en cas d'erreur
        setClients([]);
        setFilteredClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

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
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gestion des profils clients
          </CardTitle>
          <CardDescription>
            Gérez et consultez les profils de tous vos clients
          </CardDescription>
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

          {/* ✅ CORRIGÉ : Statistiques rapides utilisant les stats de l'API */}
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
    </div>
  );
}