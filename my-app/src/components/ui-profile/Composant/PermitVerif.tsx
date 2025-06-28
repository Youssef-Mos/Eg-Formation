"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download,
  AlertTriangle,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PendingDocument {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone1: string;
  };
}

export default function PermitVerificationManager() {
  const { data: session } = useSession();
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected'>('verified');
  const [adminComments, setAdminComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    try {
      const res = await fetch('/api/admin/permit-documents/pending');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      
      const documents = await res.json();
      setPendingDocuments(documents);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/admin/permit-documents/${documentId}/download`);
      if (!res.ok) throw new Error('Erreur lors du téléchargement');
      
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
      console.error('Erreur:', error);
      toast.error('Impossible de télécharger le document');
    }
  };

  const submitVerification = async () => {
    if (!selectedDocument) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/permit-documents/${selectedDocument.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: verificationStatus,
          adminComments: adminComments.trim() || null
        })
      });

      if (!res.ok) throw new Error('Erreur lors de la vérification');

      const result = await res.json();
      
      toast.success(
        verificationStatus === 'verified' 
          ? 'Document approuvé avec succès' 
          : 'Document rejeté avec succès'
      );

      // Retirer le document de la liste
      setPendingDocuments(prev => 
        prev.filter(doc => doc.id !== selectedDocument.id)
      );

      // Fermer le dialog
      setVerificationDialog(false);
      setSelectedDocument(null);
      setAdminComments('');
      setVerificationStatus('verified');

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setSubmitting(false);
    }
  };

  const openVerificationDialog = (document: PendingDocument, status: 'verified' | 'rejected') => {
    setSelectedDocument(document);
    setVerificationStatus(status);
    setAdminComments('');
    setVerificationDialog(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement des documents en attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Documents de permis en attente
          </CardTitle>
          <CardDescription>
            Vérifiez et approuvez les documents de permis soumis par les clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold">{pendingDocuments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Plus de 7 jours</p>
                    <p className="text-2xl font-bold">
                      {pendingDocuments.filter(doc => 
                        (new Date().getTime() - new Date(doc.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000
                      ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Clients uniques</p>
                    <p className="text-2xl font-bold">
                      {new Set(pendingDocuments.map(doc => doc.user.id)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des documents */}
          {pendingDocuments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun document en attente
              </h3>
              <p className="text-gray-500">
                Tous les documents de permis ont été traités !
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Soumis le</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDocuments.map((document) => {
                    const daysSinceSubmission = Math.floor(
                      (new Date().getTime() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {document.user.firstName} {document.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{document.user.email}</p>
                            <p className="text-sm text-gray-500">{document.user.phone1}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(document.fileType)}
                            <div>
                              <p className="font-medium text-sm">{document.fileName}</p>
                              <p className="text-xs text-gray-500">{document.fileType}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell>
                          {format(new Date(document.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {daysSinceSubmission > 7 ? (
                            <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                          ) : daysSinceSubmission > 3 ? (
                            <Badge className="bg-orange-100 text-orange-800">Priorité</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(document.id, document.fileName)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openVerificationDialog(document, 'verified')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openVerificationDialog(document, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Dialog de vérification */}
          <Dialog open={verificationDialog} onOpenChange={setVerificationDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {verificationStatus === 'verified' ? 'Approuver' : 'Rejeter'} le document
                </DialogTitle>
                <DialogDescription>
                  {selectedDocument && (
                    <>
                      Document de {selectedDocument.user.firstName} {selectedDocument.user.lastName} 
                      ({selectedDocument.fileName})
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {selectedDocument && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      {getFileIcon(selectedDocument.fileType)}
                      <div>
                        <p className="font-medium">{selectedDocument.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedDocument.fileSize)} • {selectedDocument.fileType}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => downloadDocument(selectedDocument.id, selectedDocument.fileName)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger et examiner le document
                    </Button>
                  </div>

                  {verificationStatus === 'rejected' && (
                    <div className="space-y-2">
                      <Label htmlFor="adminComments">
                        Raison du rejet <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="adminComments"
                        value={adminComments}
                        onChange={(e) => setAdminComments(e.target.value)}
                        placeholder="Expliquez pourquoi le document est rejeté (ex: document illisible, informations manquantes, etc.)"
                        rows={4}
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Ce commentaire sera envoyé à l'utilisateur par email.
                      </p>
                    </div>
                  )}

                  {verificationStatus === 'verified' && (
                    <div className="space-y-2">
                      <Label htmlFor="adminComments">Commentaire (optionnel)</Label>
                      <Textarea
                        id="adminComments"
                        value={adminComments}
                        onChange={(e) => setAdminComments(e.target.value)}
                        placeholder="Ajoutez un commentaire si nécessaire..."
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setVerificationDialog(false)}
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className={
                            verificationStatus === 'verified' 
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-red-600 hover:bg-red-700"
                          }
                          disabled={
                            submitting || 
                            (verificationStatus === 'rejected' && !adminComments.trim())
                          }
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              {verificationStatus === 'verified' ? (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              {verificationStatus === 'verified' ? 'Approuver' : 'Rejeter'}
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer l'action</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir {verificationStatus === 'verified' ? 'approuver' : 'rejeter'} 
                            ce document ? Cette action est irréversible et l'utilisateur sera notifié par email.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={submitVerification}>
                            Confirmer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}