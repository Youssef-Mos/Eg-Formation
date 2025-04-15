import Footer from "@/components/footer";
import Nav from "@/components/nav";
import React from "react";

export default function Contact() {
    return (
        <>
            <div className="flex justify-center items-center  flex-col gap-10 z-50">
                <div className="sticky top-0 z-50">
                    <Nav />
                </div>
                <div className="flex mt-10 justify-center px-2 py-4 flex-col gap-4 border-2 border-zinc-500 w-6xl">
                
                    <h1 className="text-3xl font-bold mb-4  text-center">Contactez-nous</h1>
                    <p className="text-lg text-center max-w-2xl">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>

                <div className="grid grid-cols-2 gap-2">

                <div className="flex px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Adresse mail</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre adresse mail..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                      
                    />
                  </label>
                </div>
                
                <div className="flex px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Numéro de téléphone</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre numéro de téléphone..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                      
                    />
                  </label>
                </div>
                <div className="flex px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Numéro de téléphone</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre numéro de téléphone..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                      
                    />
                  </label>
                </div>
                <div className="flex px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Numéro de téléphone</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre numéro de téléphone..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                      
                    />
                  </label>
                </div>
                </div>
                <div className="flex justify-center px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Message</span>
                    <textarea
                      name="name"
                      placeholder="Votre message..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full h-40 sm:w-40 md:w-48 lg:w-56 xl:w-xl rounded-lg shadow-md"
                      
                    />
                  </label>
                  </div>
                    
                </div>
                <div className="bottom-0 w-screen "><Footer /></div>
            </div>
        </>
    );
}