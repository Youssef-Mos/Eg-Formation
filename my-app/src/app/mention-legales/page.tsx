import Nav from "@/components/nav";
import React from "react";



export default function MentionsLegales() {
    return (
        <>
        <div className="flex  items-center  flex-col gap-5 h-screen z-30">
        <div className="fixed top-0 z-50">
            <Nav />
        </div>
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-200 text-black">
            <h1 className="text-3xl font-bold mb-4">Mentions Légales</h1>
            <p className="text-lg text-center max-w-2xl">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <div className="mt-10">
                <a href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Retour à l'accueil
                </a>
            </div>
        </div>
        </div>
        </>
    );
}