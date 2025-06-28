"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  Receipt, 
  Download, 
  Send, 
  Plus, 
  Search,
  Calendar,
  User,
  Euro,
  CheckCircle,
  AlertCircle,
  Mail,
  FileText,
  Edit,
  Home,
  UserCircle,
  Building,
  CreditCard,
  Loader2
} from "lucide-react";

// ✅ MISE À JOUR : Interface avec données de facturation
interface ReservationData {
  reservationId: number;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    // Adresse de domicile
    address: string;
    postalCode: string;
    city: string;
    // ✅ NOUVEAU : Adresse de facturation
    billingAddress: string;
    billingPostalCode: string;
    billingCity: string;
    billingCountry: string;
    useSameAddressForBilling: boolean;
  };
  stage: {
    id: number;
    title: string;
    date: string;
    price: number;
    numeroStage: string;
  };
  reservation: {
    id: number;
    createdAt: string;
    paymentMethod: string;
    typeStage: string;
  };
  invoice: {
    id: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null;
  hasInvoice: boolean;
  needsInvoice: boolean;
}

// ✅ MISE À JOUR : Formulaire simplifié (plus d'adresse manuelle)
interface InvoiceFormData {
  reservationId: number;
  invoiceNumber: string;
  amount: number;
  // ✅ SUPPRIMÉ : Plus besoin des champs d'adresse manuels
  // customerAddress: string;
  // customerPostalCode: string;
  // customerCity: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminFacturesPage() {
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // États pour la génération/édition de facture
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<ReservationData | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
    reservationId: 0,
    invoiceNumber: "",
    amount: 0,
    // ✅ SUPPRIMÉ : Plus de champs d'adresse manuels
  });
  
  // États pour l'envoi d'email
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<ReservationData | null>(null);
  
  // États de loading pour les actions
  const [generateLoading, setGenerateLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);

  // Charger les données au montage du composant
  useEffect(() => {
    loadReservations();
  }, []);

  // Filtrer par paramètres URL si présents
  useEffect(() => {
    const reservationId = searchParams.get('reservationId');
    if (reservationId && reservations.length > 0) {
      const targetReservation = reservations.find(r => r.reservationId === parseInt(reservationId));
      if (targetReservation) {
        handleEditInvoice(targetReservation);
      }
    }
  }, [searchParams, reservations]);

  // Filtrer les réservations selon la recherche et l'onglet actif
  useEffect(() => {
    let filtered = reservations;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.stage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.invoice?.invoiceNumber && r.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrer par onglet
    switch (activeTab) {
      case "needsInvoice":
        filtered = filtered.filter(r => r.needsInvoice);
        break;
      case "hasInvoice":
        filtered = filtered.filter(r => r.hasInvoice);
        break;
      // "all" ne filtre pas
    }

    setFilteredReservations(filtered);
    setCurrentPage(1);
  }, [reservations, searchTerm, activeTab]);

  // Calculer les données pour la pagination
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReservations = filteredReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/invoice/list');
      if (!res.ok) throw new Error('Erreur lors du chargement des données');
      
      const data = await res.json();
      setReservations(data.reservations);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (reservation: ReservationData) => {
    setCurrentReservation(reservation);
    setInvoiceFormData({
      reservationId: reservation.reservationId,
      invoiceNumber: reservation.invoice?.invoiceNumber || generateInvoiceNumber(),
      amount: reservation.invoice?.amount || reservation.stage.price,
      // ✅ SUPPRIMÉ : Plus de champs d'adresse
    });
    setShowInvoiceDialog(true);
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-5);
    return `PAP/${year}/${month}/${timestamp}`;
  };

  const handleGenerateInvoice = async () => {
    if (!currentReservation) return;
    
    setGenerateLoading(true);
    try {
      // ✅ MISE À JOUR : API simplifiée sans champs d'adresse
      const res = await fetch('/api/admin/invoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: invoiceFormData.reservationId,
          customData: {
            invoiceNumber: invoiceFormData.invoiceNumber,
            amount: invoiceFormData.amount,
            // ✅ SUPPRIMÉ : Plus de champs d'adresse manuels
          }
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de la génération');
      }
      
      const data = await res.json();
      toast.success(data.message);
      
      // ✅ NOUVEAU : Afficher les informations d'adresse utilisée
      if (data.billingInfo) {
        const addressType = data.billingInfo.usedBillingAddress 
          ? 'adresse de facturation spécifique' 
          : 'adresse de domicile';
        
        toast.info(`Facture générée avec ${addressType}: ${data.billingInfo.address}`);
      }
      
      setShowInvoiceDialog(false);
      await loadReservations();
      
    } catch (error) {
      console.error('Erreur génération:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    
    setSendLoading(true);
    try {
      const res = await fetch('/api/admin/invoice/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedInvoice.reservationId,
          customMessage: emailMessage.trim() || undefined
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi');
      }
      
      const data = await res.json();
      toast.success(data.message);
      
      // ✅ NOUVEAU : Afficher les informations d'adresse utilisée
      if (data.billingInfo) {
        toast.info(`Email envoyé à ${data.sentTo} avec ${data.billingInfo.addressType}`);
      }
      
      setShowEmailDialog(false);
      setEmailMessage("");
      setSelectedInvoice(null);
      
    } catch (error) {
      console.error('Erreur envoi:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
    } finally {
      setSendLoading(false);
    }
  };

  const handleDownloadInvoice = async (reservation: ReservationData) => {
    if (!reservation.hasInvoice) return;
    
    setDownloadLoading(reservation.reservationId);
    try {
      const url = `/api/admin/invoice/download?reservationId=${reservation.reservationId}`;
      window.open(url, '_blank');
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleOpenEmailDialog = (reservation: ReservationData) => {
    setSelectedInvoice(reservation);
    setEmailMessage("");
    setShowEmailDialog(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ NOUVEAU : Fonction pour formater l'adresse de facturation
  const formatBillingAddress = (customer: ReservationData['customer']) => {
    if (customer.useSameAddressForBilling) {
      return `${customer.address}, ${customer.postalCode} ${customer.city}`;
    } else {
      return `${customer.billingAddress}, ${customer.billingPostalCode} ${customer.billingCity}`;
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true} requireAdmin={true}>
        <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <div className="container mx-auto p-6">
        {/* Navigation épurée */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link 
              href="/profil"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Historique réservations</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Receipt className="w-4 h-4" />
            <span>Gestion des factures</span>
          </div>
        </div>

        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Gestion des Factures</h1>
          <p className="text-gray-600">Gérez les factures pour toutes les réservations payées</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total réservations</p>
                  <p className="text-2xl font-bold">{reservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Factures émises</p>
                  <p className="text-2xl font-bold">{reservations.filter(r => r.hasInvoice).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">À facturer</p>
                  <p className="text-2xl font-bold">{reservations.filter(r => r.needsInvoice).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, stage ou numéro de facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({reservations.length})</TabsTrigger>
            <TabsTrigger value="needsInvoice">À facturer ({reservations.filter(r => r.needsInvoice).length})</TabsTrigger>
            <TabsTrigger value="hasInvoice">Facturées ({reservations.filter(r => r.hasInvoice).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredReservations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? "Aucune réservation trouvée" : "Aucune réservation dans cette catégorie"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Liste des réservations paginées */}
                <div className="space-y-4 mb-6">
                  {paginatedReservations.map((reservation) => (
                    <Card key={reservation.reservationId}>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                          {/* Informations client */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Client</span>
                            </div>
                            <p className="font-semibold">{reservation.customer.firstName} {reservation.customer.lastName}</p>
                            <p className="text-sm text-gray-600">{reservation.customer.email}</p>
                            <p className="text-xs text-gray-500">
                              {reservation.customer.address && `${reservation.customer.address}, `}
                              {reservation.customer.postalCode} {reservation.customer.city}
                            </p>
                          </div>

                          {/* Informations stage */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Stage</span>
                            </div>
                            <p className="font-semibold">{reservation.stage.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(reservation.stage.date).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-sm text-gray-600">N° {reservation.stage.numeroStage}</p>
                          </div>

                          {/* ✅ NOUVEAU : Informations de facturation */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Facturation</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              {reservation.customer.useSameAddressForBilling ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Home className="w-3 h-3 mr-1" />
                                  Domicile
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Building className="w-3 h-3 mr-1" />
                                  Spécifique
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatBillingAddress(reservation.customer)}
                            </p>
                          </div>

                          {/* Informations facture */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Euro className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Facture</span>
                            </div>
                            {reservation.hasInvoice ? (
                              <>
                                <p className="font-semibold text-green-600">{reservation.invoice!.invoiceNumber}</p>
                                <p className="text-sm text-gray-600">{reservation.invoice!.amount}€</p>
                                <p className="text-xs text-gray-500">
                                  Émise le {new Date(reservation.invoice!.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-orange-600 font-medium">Non émise</p>
                                <p className="text-sm text-gray-600">{reservation.stage.price}€</p>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleEditInvoice(reservation)}
                              className="flex items-center gap-2"
                              variant={reservation.hasInvoice ? "outline" : "default"}
                            >
                              {reservation.hasInvoice ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              {reservation.hasInvoice ? "Modifier" : "Créer"}
                            </Button>

                            {reservation.hasInvoice && (
                              <>
                                <Button
                                  onClick={() => handleDownloadInvoice(reservation)}
                                  disabled={downloadLoading === reservation.reservationId}
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  {downloadLoading === reservation.reservationId ? "..." : "Télécharger"}
                                </Button>

                                <Button
                                  onClick={() => handleOpenEmailDialog(reservation)}
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" />
                                  Envoyer
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Affichage de {startIndex + 1} à {Math.min(startIndex + ITEMS_PER_PAGE, filteredReservations.length)} sur {filteredReservations.length} réservations
                    </p>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={page === currentPage}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* ✅ NOUVEAU : Dialog compact et responsive en paysage */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl">
                {currentReservation?.hasInvoice ? "Modifier la facture" : "Créer une facture"}
              </DialogTitle>
            </DialogHeader>
            {currentReservation && (
              <div className="space-y-6">
                {/* Layout en grille responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche : Informations client */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">Client</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium text-lg">{currentReservation.customer.firstName} {currentReservation.customer.lastName}</p>
                        <p className="text-gray-600">{currentReservation.customer.email}</p>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Home className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Domicile :</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {currentReservation.customer.address}<br />
                            {currentReservation.customer.postalCode} {currentReservation.customer.city}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Facturation :</span>
                            {currentReservation.customer.useSameAddressForBilling ? (
                              <Badge variant="secondary" className="text-xs">Identique</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Spécifique</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {formatBillingAddress(currentReservation.customer)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informations stage */}
                    <div className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-lg">Stage</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Titre :</span>
                          <p className="text-sm font-medium">{currentReservation.stage.title}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Numéro :</span>
                          <p className="text-sm font-medium">#{currentReservation.stage.numeroStage}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Date :</span>
                          <p className="text-sm font-medium">
                            {new Date(currentReservation.stage.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Prix :</span>
                          <p className="text-sm font-medium text-green-600">{currentReservation.stage.price}€</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite : Formulaire de facture */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">Facture</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoiceNumber" className="text-sm font-medium">
                            Numéro de facture
                          </Label>
                          <Input
                            id="invoiceNumber"
                            value={invoiceFormData.invoiceNumber}
                            onChange={(e) => setInvoiceFormData(prev => ({...prev, invoiceNumber: e.target.value}))}
                            placeholder="PAP/2024/01/12345"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-sm font-medium">
                            Montant (€)
                          </Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={invoiceFormData.amount}
                            onChange={(e) => setInvoiceFormData(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <p className="font-medium mb-1">Information automatique :</p>
                              <p>L'adresse de facturation sera déterminée selon les préférences du client (domicile ou spécifique).</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aperçu rapide */}
                    <div className="border rounded-lg p-4 bg-yellow-50">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Aperçu de la facture :</h4>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p><strong>Client :</strong> {currentReservation.customer.firstName} {currentReservation.customer.lastName}</p>
                        <p><strong>Stage :</strong> {currentReservation.stage.title}</p>
                        <p><strong>Numéro :</strong> {invoiceFormData.invoiceNumber || "À définir"}</p>
                        <p><strong>Montant :</strong> {invoiceFormData.amount || 0}€</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action en bas */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowInvoiceDialog(false)}
                    className="flex-1 sm:flex-initial sm:min-w-[120px]"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={generateLoading || !invoiceFormData.invoiceNumber || invoiceFormData.amount <= 0}
                    className="flex-1 sm:flex-initial sm:min-w-[150px]"
                  >
                    {generateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        {currentReservation.hasInvoice ? "Modifier la facture" : "Créer la facture"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ✅ MISE À JOUR : Dialog d'envoi par email amélioré */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Envoyer la facture par email
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Destinataire</span>
                  </div>
                  <p className="font-medium">{selectedInvoice.customer.firstName} {selectedInvoice.customer.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.customer.email}</p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Facture à envoyer :</span>
                    </div>
                    <p className="text-sm font-medium text-blue-600">{selectedInvoice.invoice!.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      Stage : {selectedInvoice.stage.title} • {selectedInvoice.invoice!.amount}€
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailMessage">Message personnalisé (optionnel)</Label>
                  <Textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Laissez vide pour utiliser le message par défaut qui inclut tous les détails de la réservation et l'adresse de facturation..."
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    💡 Le message par défaut inclut automatiquement les détails du stage, l'adresse de facturation utilisée et les informations de contact.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailDialog(false)}
                    className="flex-1 sm:flex-initial"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSendInvoice}
                    disabled={sendLoading}
                    className="flex-1 sm:flex-initial"
                  >
                    {sendLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer la facture
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}