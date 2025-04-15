import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";
import React from "react";



export default function MentionsLegales() {
    return (
        <>
        <div className="flex  items-center bg-zinc-100  flex-col gap-5 h-screen z-30">
        <div className="fixed top-0 z-50">
            <Nav />
        </div>
        <div className="flex flex-col items-center justify-center h-screen  text-black">
            <h1 className="text-3xl font-bold mb-4">Mentions Légales</h1>
            <p className="text-lg text-center max-w-2xl">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <Button className="mt-10 cursor-pointer">
                <a href="/" className="">
                    Retour à l'accueil
                </a>
            </Button>
        </div>
        <div className="w-screen"><Footer /></div>
        
        </div>
        
        </>
    );
}