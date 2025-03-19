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
                    <div className="flex gap-1 flex-col ">
                        <div className="flex gap-2"><input type="radio" name="radio-1" className="radio-md cursor-pointer" /> <p>Masculin</p></div>
                    
                        <div className="flex gap-2"> <input type="radio" name="radio-1" className="radio-md cursor-pointer" /> <p>Feminin</p></div>
                    </div>

                    <div>
                        <label className="floating-label label">
                            <span className="text-amber-500 bg- bg-amber-50">Your Email</span>
                            <input type="text" placeholder="mail@site.com" className="input-ghost  input input-md w-xs rounded-lg  bg-amber-200" />
                        </label>    
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