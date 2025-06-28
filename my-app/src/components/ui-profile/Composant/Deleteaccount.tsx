"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";
import { 
  Trash2, 
  Key, 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  Settings,
  Cookie,
  Clock,
  Trash,
  RefreshCw
} from "lucide-react";
import { useCookieConsent } from "@/components/Cookies/cookie-consent";

// ✅ Types corrigés pour éviter l'erreur TypeScript
type PasswordFieldKey = 'current' | 'new' | 'confirm';
type ShowPasswordsState = Record<PasswordFieldKey, boolean>;

type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';
type ConsentData = Record<CookieCategory, boolean>;

// Composant de validation du mot de passe
const PasswordValidator = ({ password }: { password: string }) => {
  const validations = [
    { test: password.length >= 6, label: "Au moins 6 caractères" },
    { test: /[A-Z]/.test(password), label: "Une majuscule" },
    { test: /[0-9]/.test(password), label: "Un chiffre" },
    { test: /[^A-Za-z0-9]/.test(password), label: "Un caractère spécial" },
  ];

  const isValid = validations.every(v => v.test);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${isValid ? "text-green-500" : "text-gray-400"}`} />
        <span className={`text-sm font-medium ${isValid ? "text-green-600" : "text-gray-500"}`}>
          Sécurité du mot de passe
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {validations.map((validation, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              validation.test ? "bg-green-500" : "bg-gray-300"
            }`} />
            <span className={`text-xs transition-colors ${
              validation.test ? "text-green-600" : "text-gray-500"
            }`}>
              {validation.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant de gestion des cookies
const CookieManagement = () => {
  const { consent, hasConsent, saveConsent, revokeConsent } = useCookieConsent();
  const [localConsent, setLocalConsent] = useState<ConsentData>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Charger le consentement actuel
  useEffect(() => {
    if (consent) {
      setLocalConsent(consent);
    }
  }, [consent]);

  const cookieCategories = {
    necessary: {
      name: 'Cookies nécessaires',
      description: 'Essentiels au fonctionnement du site (connexion, sécurité)',
      required: true,
      icon: Shield
    },
    analytics: {
      name: 'Cookies analytiques',
      description: 'Nous aident à comprendre l\'utilisation du site (Google Analytics)',
      required: false,
      icon: Settings
    },
    marketing: {
      name: 'Cookies marketing',
      description: 'Pour personnaliser le contenu et les publicités',
      required: false,
      icon: Cookie
    },
    preferences: {
      name: 'Cookies de préférences',
      description: 'Mémorisent vos paramètres (thème, langue)',
      required: false,
      icon: Settings
    }
  };

  const updateConsent = async () => {
    setIsUpdating(true);
    try {
      // Sauvegarder les nouvelles préférences
      saveConsent(localConsent);
      toast.success("Préférences de cookies mises à jour !");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeAll = () => {
    revokeConsent();
    setLocalConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
    toast.success("Consentement révoqué. Le banner va réapparaître.");
  };

  const getConsentInfo = () => {
    try {
      const savedData = localStorage.getItem('cookie-consent');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return {
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : null,
          version: parsed.version || 'N/A'
        };
      }
    } catch (error) {
      console.error("Erreur lecture cookie consent:", error);
    }
    return { timestamp: null, version: 'N/A' };
  };

  const consentInfo = getConsentInfo();

  if (!consent) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Cookie className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Aucune préférence de cookies enregistrée</p>
        <p className="text-sm">Le banner de consentement apparaîtra à votre prochaine visite</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informations sur le consentement actuel */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-800">Consentement actuel</h4>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Donné le : {consentInfo.timestamp ? consentInfo.timestamp.toLocaleString('fr-FR') : 'Inconnu'}</p>
          <p>Version : {consentInfo.version}</p>
          <p className="text-xs text-blue-600">Le consentement expire automatiquement après 24h</p>
        </div>
      </div>

      {/* Paramètres par catégorie */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Gérer les préférences</h4>
        {Object.entries(cookieCategories).map(([key, category]) => {
          const IconComponent = category.icon;
          const isEnabled = localConsent[key as CookieCategory];
          
          return (
            <div key={key} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <IconComponent className={`w-5 h-5 mt-0.5 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">{category.name}</h5>
                    {category.required && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      isEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => 
                  setLocalConsent(prev => ({
                    ...prev,
                    [key]: checked
                  }))
                }
                disabled={category.required}
                className="ml-4"
              />
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <Button 
          onClick={updateConsent}
          disabled={isUpdating}
          className="flex-1"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sauvegarder les préférences
            </>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleRevokeAll}
          className="flex-1"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Révoquer tout
        </Button>
      </div>
    </div>
  );
};

export default function AccountSettingsDialog() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // ✅ États avec types corrects
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCookieDialogOpen, setIsCookieDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState<ShowPasswordsState>({
    current: false,
    new: false,
    confirm: false,
  });

  // États pour la suppression du compte
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Fonction corrigée avec types appropriés
  const togglePasswordVisibility = (field: PasswordFieldKey) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordChange = () => {
    if (!passwordData.currentPassword) {
      toast.error("Veuillez saisir votre mot de passe actuel");
      return false;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      toast.error("Le nouveau mot de passe doit contenir au moins une majuscule");
      return false;
    }
    
    if (!/[0-9]/.test(passwordData.newPassword)) {
      toast.error("Le nouveau mot de passe doit contenir au moins un chiffre");
      return false;
    }
    
    if (!/[^A-Za-z0-9]/.test(passwordData.newPassword)) {
      toast.error("Le nouveau mot de passe doit contenir au moins un caractère spécial");
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return false;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien");
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordChange()) return;

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors du changement de mot de passe");
      }

      toast.success("Mot de passe modifié avec succès !");
      setIsPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossible de modifier le mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      toast.error("Veuillez taper 'SUPPRIMER' pour confirmer");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/user/${session?.user?.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      toast.success("Compte supprimé avec succès");
      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossible de supprimer le compte");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Paramètres du compte
        </CardTitle>
        <CardDescription>
          Gérez la sécurité, les cookies et les paramètres de votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Section Sécurité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Sécurité</h3>
          </div>
          
          {/* Changement de mot de passe */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
              >
                <Key className="w-4 h-4 mr-2" />
                Modifier le mot de passe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Modifier le mot de passe
                </DialogTitle>
                <DialogDescription>
                  Saisissez votre mot de passe actuel et choisissez-en un nouveau.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Mot de passe actuel */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                      placeholder="Votre mot de passe actuel"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      placeholder="Votre nouveau mot de passe"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <PasswordValidator password={passwordData.newPassword} />
                </div>

                {/* Confirmation nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Les mots de passe ne correspondent pas</span>
                    </div>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Les mots de passe correspondent</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordDialogOpen(false)}
                  disabled={isChangingPassword}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePasswordSubmit}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Modifier le mot de passe
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ✅ Nouvelle section Gestion des cookies */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Cookie className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Confidentialité et cookies</h3>
          </div>
          
          <Dialog open={isCookieDialogOpen} onOpenChange={setIsCookieDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors duration-200"
              >
                <Cookie className="w-4 h-4 mr-2" />
                Gérer les cookies et préférences
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-orange-600" />
                  Gestion des cookies
                </DialogTitle>
                <DialogDescription>
                  Gérez vos préférences de cookies et votre consentement. Ces paramètres expirent automatiquement après 24h.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <CookieManagement />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCookieDialogOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Section Danger Zone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-red-800">Zone de danger</h3>
          </div>
          
          {/* Suppression du compte */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full cursor-pointer hover:bg-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <div>
                    Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement effacées :
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 bg-red-50 p-3 rounded-lg">
                    <li>Vos informations personnelles</li>
                    <li>Votre historique de réservations</li>
                    <li>Vos préférences et paramètres</li>
                  </ul>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Attention :</strong> Si vous avez des réservations actives, la suppression sera impossible.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-3 py-4">
                <Label htmlFor="delete-confirmation">
                  Tapez <strong>"SUPPRIMER"</strong> pour confirmer :
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="text-center font-mono"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== "SUPPRIMER"}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}