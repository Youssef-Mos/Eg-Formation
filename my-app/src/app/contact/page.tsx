"use client";

import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

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
            
            // Effacer le message de succès après 5 secondes
            setTimeout(() => {
                setStatus(prev => ({ ...prev, success: false }));
            }, 5000);
            
        } catch (error) {
            setStatus({
                submitting: false,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    };

    return (
        <>
            <div className="flex justify-center items-center flex-col gap-10 z-50">
                <div className="sticky top-0 z-50">
                    <Nav />
                </div>
                <div className="flex mt-10 justify-center px-3 py-4 flex-col gap-4 border-2 rounded-2xl shadow-lg shadow-zinc-300 border-zinc-900 hover:shadow-xl hover:shadow-zinc-300 transition-all duration-200 ease-in w-md md:w-lg lg:w-4xl xl:w-6xl">
                
                    <h1 className="text-3xl max-md:text-2xl font-bold mb-4 text-center">Contactez-nous</h1>
                    <h2 className="text-lg max-md:text-sm mb-5 text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</h2>
                    
                    {status.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                            <span className="block sm:inline">Votre message a été envoyé avec succès!</span>
                        </div>
                    )}
                    
                    {status.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            <span className="block sm:inline">{status.error}</span>
                        </div>
                    )}
                    
                    
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-center items-center flex-col gap-5">
                        <div className="grid m-auto grid-cols-2 max-sm:grid-cols-1 mb-5 gap-2">
                            <div className="flex px-6">
                                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                                    <span className="!bg-white">Nom</span>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        placeholder="Votre nom..."
                                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="flex px-6">
                                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                                    <span className="!bg-white">Adresse mail</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Votre adresse mail..."
                                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="flex px-6">
                                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                                    <span className="!bg-white">Prénom</span>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        placeholder="Votre prénom..."
                                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                                        required
                                    />
                                </label>
                            </div>
                            <div className="flex px-6">
                                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                                    <span className="!bg-white">Numéro de téléphone</span>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        placeholder="Votre numéro de téléphone..."
                                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                                        required
                                    />
                                </label>
                            </div>
                        </div>
                        </div>
                        <div className="flex justify-center gap-5 items-center flex-col">
                            <div className="flex justify-center px-6">
                                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                                    <span className="!bg-white">Message</span>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Votre message..."
                                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full h-40 max-sm:w-3xs md:w-48 lg:w-56 xl:w-2xl rounded-lg shadow-md"
                                        required
                                    />
                                </label>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-48 ml-3.5 cursor-pointer"
                                disabled={status.submitting}
                            >
                                {status.submitting ? "Envoi en cours..." : "Envoyer"}
                            </Button>
                        </div>
                    </form>

                </div>
                <div className="bottom-0 w-screen"><Footer /></div>
            </div>
        </>
    );
}