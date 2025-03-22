'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Nav from "@/components/nav";
import { DatePicker } from "@/components/ui-reservation/datapicker";
import { Background } from "@/components/background";


export default function Register() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
        <>
        
        <div className="flex justify-center bg-gradient-to-tr from-zinc-300 via-stone-100 to-zinc-200 animate-gradient items-center gap-5 flex-col z-50  ">
        < Background  />
            <Nav />
            <div className="border-2 bg-zinc-50 sm:h-full w-sm md:w-xl lg:w-4xl rounded-xl mt-4  hover:shadow-2xl transition-all duration-200 ease-in gap-5 ">
                <h1 className='text-2xl md:text-4xl font-bold text-center mt-5 gap-5'>Créer votre compte :</h1>
                <div className="flex flex-col lg:flex-row justify-center items-center gap-6 lg:gap-36">
                <div className="flex flex-col items-center justify-center mt-7 gap-5 lg:mb-10">
                <p className='text-xl md:text-2xl font-bold text-center'>Vos informations de contacts :</p>
                    <div className="flex gap-1 flex-col ">
                        <div className="flex gap-2"><input type="radio" name="radio-1" className="radio-md cursor-pointer" /> <p>Masculin</p></div>
                    
                        <div className="flex gap-2"> <input type="radio" name="radio-1" className="radio-md cursor-pointer" /> <p>Feminin</p></div>
                    </div>

                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Nom</span>
                            <input type="text" placeholder="Votre nom..." className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Prénom</span>
                            <input type="text" placeholder="Votre prénom..." className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Your Email</span>
                            <input type="text" placeholder="Votre e-mail" className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        
                    <DatePicker onDateChange={(date) => console.log("Date sélectionnée :", date)} />
                    </div>

                    <div>
                        <label className="floating-label label bg-white text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Lieu de naissance</span>
                            <input type="text" placeholder="Votre lieu de naissance..." className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                </div>
            
            
        
                <div className="flex flex-col justify-center items-center gap-3 mb-5">
                
                <p className='text-xl md:text-2xl font-bold text-center '>Vos informations de contacts :</p>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Adresse 1</span>
                            <input type="text" placeholder="Votre Adresse 1..." className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>

                    <div className="flex gap-5">
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Adresse 2</span>
                            <input type="text" placeholder="Votre Adresse 2..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Adresse 3</span>
                            <input type="text" placeholder="Votre Adresse 3..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    </div>
                    <div className="flex gap-5">
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Code postal</span>
                            <input type="text" placeholder="Votre Code postal..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Ville</span>
                            <input type="text" placeholder="Votre Ville..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    </div>
                    <div className="flex gap-5">
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Téléphone 1</span>
                            <input type="text" placeholder="Votre Téléphone 1..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">Téléphone 2</span>
                            <input type="text" placeholder="Votre Téléphone 2..." className="bg-zinc-50 outline-0 text-zinc-900 input w-36 rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                    </div>
                    <div>
                        <label className="floating-label label  text-white rounded-lg border-1 border-gray-300 focus:bg-white">
                            <span className="!bg-white text-zinc-900 focus:bg-white active:bg-amber-50">E-mail</span>
                            <input type="text" placeholder="Votre E-mail..." className="bg-zinc-50 outline-0 text-zinc-900 input w-xs rounded-lg focus:bg-white shadow-md" />
                        </label>    
                    </div>
                
            </div>
            </div>
            </div>
        </div>
        </>
    );
}