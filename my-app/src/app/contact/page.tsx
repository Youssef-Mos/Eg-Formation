"use client";

import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { toast } from "sonner";
import { 
  Mail, 
  Phone, 
  User, 
  MessageSquare, 
  Loader2, 
  Send,
  MapPin,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    message: ""
  });
  
  const [status, setStatus] = useState<{
    submitting: boolean;
    success: boolean;
    error: string | null;
  }>({
    submitting: false,
    success: false,
    error: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setStatus({ submitting: true, success: false, error: null });
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      // Réinitialiser le formulaire en cas de succès
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        message: ""
      });
      
      setStatus({
        submitting: false,
        success: true,
        error: null
      });
      
      toast.success("Message envoyé avec succès !");
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setStatus(prev => ({ ...prev, success: false }));
      }, 5000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus({
        submitting: false,
        success: false,
        error: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  return (
<div className="min-h-screen flex max-sm:items-center justify-center gap-10 flex-col">
      <Nav />
      
      <div className="flex-grow container max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Notre équipe est à votre disposition pour répondre à toutes vos questions concernant nos stages de sensibilisation à la sécurité routière.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Nos coordonnées
                </CardTitle>
                <CardDescription>
                  Plusieurs moyens pour nous joindre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Téléphone</h3>
                    <p className="text-gray-600">07 83 37 25 65</p>
                    <p className="text-sm text-gray-500">Lundi au samedi, 10h-12h et 14h-16h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a 
                      href="mailto:contact@eg-formations.com" 
                      className="text-blue-600 hover:underline"
                    >
                      contact@eg-formations.com
                    </a>
                    <p className="text-sm text-gray-500">Réponse sous 24h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Adresse</h3>
                    <p className="text-gray-600">61, rue de Lyon</p>
                    <p className="text-gray-600">75012 Paris</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Horaires</h3>
                    <p className="text-gray-600">Lundi - Samedi (uniquement sous rdv)</p>
                    <p className="text-gray-600">10h00 - 12h00 et 14h00 - 16h00</p>
                    <p className="text-sm text-gray-500">Fermé le dimanche</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Envoyez-nous un message
                </CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status.success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Message envoyé avec succès !</p>
                      <p className="text-green-700 text-sm">Nous vous répondrons dans les plus brefs délais.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nom" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Nom *
                      </Label>
                      <Input
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Votre nom"
                        disabled={status.submitting}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prenom" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Prénom *
                      </Label>
                      <Input
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        placeholder="Votre prénom"
                        disabled={status.submitting}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="votre.email@exemple.com"
                        disabled={status.submitting}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Téléphone *
                      </Label>
                      <Input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="01 23 45 67 89"
                        disabled={status.submitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre demande ou vos questions..."
                      className="min-h-[120px]"
                      disabled={status.submitting}
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto px-8"
                      disabled={status.submitting}
                    >
                      {status.submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section informations supplémentaires */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Réponse rapide</h3>
              <p className="text-sm text-gray-600">
                Nous nous engageons à vous répondre dans les 24 heures ouvrées
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Équipe experte</h3>
              <p className="text-sm text-gray-600">
                Nos conseillers sont spécialisés dans la formation routière
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Support personnalisé</h3>
              <p className="text-sm text-gray-600">
                Chaque demande est traitée avec attention et personnalisation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}