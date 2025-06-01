"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  FileText, 
  Upload, 
  X,
  CheckCircle2,
  Clock
} from "lucide-react";
import PermitUpload from "./PermitUpload";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface UserStatus {
  permitDocumentUploaded: boolean;
  permitDocumentVerified: boolean;
  profileCompleted: boolean;
}

export default function PermitNotificationBanner() {
  const { data: session } = useSession();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger le statut de l'utilisateur et les notifications
  useEffect(() => {
    if (session?.user?.id) {
      loadUserStatus();
      loadNotifications();
    }
  }, [session]);

  const loadUserStatus = async () => {
    try {
      const res = await fetch(`/api/user/${session?.user.id}`);
      if (res.ok) {
        const userData = await res.json();
        setUserStatus({
          permitDocumentUploaded: userData.permitDocumentUploaded,
          permitDocumentVerified: userData.permitDocumentVerified,
          profileCompleted: userData.profileCompleted
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/user/notifications?unreadOnly=true');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationIds: number[]) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds })
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    loadUserStatus();
    loadNotifications();
    toast.success("Document téléchargé avec succès !");
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Marquer les notifications de permis comme lues
    const permitNotifications = notifications
      .filter(n => n.type === 'permit_reminder')
      .map(n => n.id);
    
    if (permitNotifications.length > 0) {
      markNotificationAsRead(permitNotifications);
    }
  };

  // Ne pas afficher si l'utilisateur n'est pas connecté ou n'est pas un client
  if (!session || session.user.role !== 'client' || loading || dismissed) {
    return null;
  }

  // Ne pas afficher si le permis est déjà téléchargé
  if (userStatus?.permitDocumentUploaded) {
    return null;
  }

  // Vérifier s'il y a des notifications de rappel de permis non lues
  const hasPermitReminder = notifications.some(n => 
    n.type === 'permit_reminder' && !n.read
  );

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert className="border-orange-200 bg-orange-50 shadow-lg">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 flex items-center justify-between">
          Document de permis requis
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-orange-700 mt-2">
          <div className="flex flex-col gap-3">
            <p>
              Pour finaliser votre inscription et pouvoir réserver des stages, 
              vous devez télécharger une copie de votre permis de conduire.
            </p>
            
            {hasPermitReminder && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Rappel envoyé par notre équipe</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger mon permis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Télécharger votre permis de conduire</DialogTitle>
                    <DialogDescription>
                      Ajoutez une copie de votre permis pour compléter votre profil
                    </DialogDescription>
                  </DialogHeader>
                  
                  <PermitUpload 
                    showExisting={false}
                    isInProfile={false}
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={(error) => {
                      toast.error(error);
                    }}
                  />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDismiss}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Plus tard
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Composant pour afficher les notifications dans le profil
export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true })
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'permit_reminder':
        return <FileText className="h-5 w-5 text-orange-600" />;
      case 'permit_verified':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'permit_rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAllAsRead}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center p-8">
          <div className="text-gray-400 mb-2">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg transition-colors ${
                notification.read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className={`font-medium ${
                      notification.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 whitespace-pre-line ${
                    notification.read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
                    >
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}