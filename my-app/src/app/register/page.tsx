'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Nav from "@/components/nav";

export default function Register() {
    return (
        <>
        
        <div className="flex justify-center items-center gap-5 flex-col">
            <Nav />
            <div className="border-2 h-screen w-sm rounded-xl mt-4 hover:shadow-2xl transition-all duration-200 ease-in gap-5">
                <h1 className='text-2xl md:text-4xl font-bold text-center mt-5 gap-5'>Créer votre compte :</h1>
                <div className="flex flex-col items-center justify-center mt-7 gap-5">
                    <div>
                    <input type="radio" name="radio-1" className="radio" defaultChecked />
                    <input type="radio" name="radio-1" className="radio" />
                    </div>

                    <div>
                    <Label htmlFor="nom" className="flex items-start">Nom</Label>
                    <Input type="nom" id="nom" placeholder="
                    Votre nom" className="w-xs" />
                    </div>
                    <div>
                    <Label htmlFor="prenom" className="flex items-start">Prénom</Label>
                    <Input type="prenom" id="prenom" placeholder="
                    Votre prénom" className="w-xs" />
                    </div>
                </div>

            </div>
            
        </div>
        </>
    );
}