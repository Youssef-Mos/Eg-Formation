"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
 

export default function CGU() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">Conditions Générales d'Utilisation</h1>
            <p className="text-lg mb-4">Bienvenue sur notre site !</p>
            <p className="text-lg mb-4">Veuillez lire attentivement nos CGU avant d'utiliser notre service.</p>
            <Button variant="default" className="mt-4">Revenir à l'inscription</Button>
        </div>
    );
}