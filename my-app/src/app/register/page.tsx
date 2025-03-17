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
            <div className="border-2 h-screen w-lg rounded-xl mt-4">
                <h1 className='text-2xl md:text-4xl font-bold text-center mt-5'>Créer votre compte :</h1>

            </div>
            
        </div>
        </>
    );
}