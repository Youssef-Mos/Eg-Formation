"use client";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Upload, 
  File, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  FileText,
  Image,
  Trash2,
  Eye,
  Download
} from "lucide-react";

interface PermitDocument {
  id: number;
  fileName: string;
  status: 'pending' | 'verified' | 'rejected';
  adminComments?: string;
  createdAt: string;
  verifiedAt?: string;
}

interface PermitUploadProps {
  onUploadSuccess?: (document: PermitDocument) => void;
  onUploadError?: (error: string) => void;
  showExisting?: boolean;
  isInProfile?: boolean;
}

export default function PermitUpload({ 
  onUploadSuccess, 
  onUploadError, 
  showExisting = true,
  isInProfile = false 
}: PermitUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingDocuments, setExistingDocuments] = useState<PermitDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Charger les documents existants
  React.useEffect(() => {
    if (showExisting) {
      loadExistingDocuments();
    }
  }, [showExisting]);

  const loadExistingDocuments = async () => {
    setLoadingDocuments(true);
    try {
      // ✅ CORRECTION : Bonne URL pour récupérer les documents
      const res = await fetch('/api/user/permit-document');
      if (res.ok) {
        const result = await res.json();
        console.log('Documents récupérés:', result);
        
        // ✅ CORRECTION : Gérer la structure de réponse
        if (result.success && result.documents) {
          setExistingDocuments(result.documents);
        } else if (Array.isArray(result)) {
          setExistingDocuments(result);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Gestion du drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      console.log('Fichier déposé:', files[0]);
      handleFileSelect(files[0]);
    }
  };

  // Gestion de la sélection de fichier
  const handleFileSelect = (file: File) => {
    console.log('Fichier sélectionné:', file);
    
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG");
      return;
    }

    // Vérifier la taille (10MB max pour correspondre à l'API)
    const maxSize = 10 * 1024 * 1024; // ✅ CORRECTION : 10MB comme dans l'API
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux. Taille maximale : 10MB");
      return;
    }

    setSelectedFile(file);
    toast.success(`Fichier "${file.name}" sélectionné`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Fichier sélectionné via input:', files[0]);
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    console.log('Début de l\'upload pour:', selectedFile);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      // ✅ CORRECTION : Nom du champ correspondant à l'API
      formData.append('file', selectedFile);

      console.log('FormData créé:', formData);
      console.log('Fichier dans FormData:', formData.get('file'));

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // ✅ CORRECTION : Bonne URL pour l'upload
      const res = await fetch('/api/user/permit-document', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Réponse HTTP:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur API:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Erreur lors de l\'upload');
        } catch (parseError) {
          throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
        }
      }

      const result = await res.json();
      console.log('Résultat upload:', result);
      
      toast.success("Document téléchargé avec succès !");
      setSelectedFile(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(result.document);
      }
      
      // Recharger les documents existants
      if (showExisting) {
        loadExistingDocuments();
      }

    } catch (error: any) {
      console.error('Erreur upload:', error);
      const errorMessage = error.message || "Erreur lors du téléchargement";
      toast.error(errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // ✅ CORRECTION : Fonction pour voir le document
  const viewDocument = async (documentId: number) => {
    try {
      const res = await fetch(`/api/user/permit-documents/${documentId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        toast.error("Impossible d'ouvrir le document");
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error);
      toast.error("Erreur lors de l'ouverture du document");
    }
  };

  // ✅ CORRECTION : Fonction pour supprimer le document
  const deleteDocument = async (documentId: number) => {
    try {
      const res = await fetch(`/api/user/permit-documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success("Document supprimé avec succès");
        loadExistingDocuments(); // Recharger la liste
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <Image className="w-8 h-8 text-blue-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Vérifié</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasVerifiedDocument = existingDocuments.some(doc => doc.status === 'verified');
  const hasPendingDocument = existingDocuments.some(doc => doc.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Documents existants */}
      {showExisting && (
        <div>
          <Label className="text-base font-medium mb-3 block">
            Documents de permis existants
          </Label>
          
          {loadingDocuments ? (
            <div className="flex items-center justify-center p-4 border rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Chargement...
            </div>
          ) : existingDocuments.length > 0 ? (
            <div className="space-y-3">
              {existingDocuments.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.fileName)}
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-gray-500">
                          Téléchargé le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {doc.verifiedAt && (
                          <p className="text-sm text-gray-500">
                            Vérifié le {new Date(doc.verifiedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {doc.adminComments && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm font-medium text-yellow-800">Commentaire administrateur :</p>
                            <p className="text-sm text-yellow-700">{doc.adminComments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {/* ✅ AJOUT : Boutons d'action */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDocument(doc.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {doc.status !== 'verified' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDocument(doc.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucun document de permis téléchargé</p>
            </div>
          )}
        </div>
      )}

      {/* Formulaire d'upload */}
      {(!hasVerifiedDocument && !hasPendingDocument) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Télécharger votre permis de conduire
            </CardTitle>
            <CardDescription>
              Ajoutez une copie de votre permis de conduire pour compléter votre profil. 
              Formats acceptés : PDF, JPEG, PNG (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedFile ? (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input 
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                  disabled={uploading}
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600">Déposez le fichier ici...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Glissez-déposez votre fichier ici, ou <span className="text-blue-600">cliquez pour parcourir</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, JPEG, PNG • Maximum 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeSelectedFile}
                    disabled={uploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Téléchargement en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger
                  </>
                )}
              </Button>
            </div>

            {/* Informations importantes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Informations importantes :</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Assurez-vous que votre permis est lisible et non expiré</li>
                    <li>• Les informations du document seront vérifiées par notre équipe</li>
                    <li>• Vous recevrez une notification une fois la vérification terminée</li>
                    <li>• En cas de rejet, vous pourrez télécharger un nouveau document</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si document déjà vérifié */}
      {hasVerifiedDocument && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Document vérifié</h3>
                <p className="text-sm text-green-600">
                  Votre permis de conduire a été vérifié et approuvé par notre équipe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si document en attente */}
      {hasPendingDocument && !hasVerifiedDocument && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
              <div>
                <h3 className="font-medium text-yellow-800">Document en cours de vérification</h3>
                <p className="text-sm text-yellow-600">
                  Votre document est en cours de vérification par notre équipe. 
                  Vous recevrez une notification une fois le processus terminé.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}