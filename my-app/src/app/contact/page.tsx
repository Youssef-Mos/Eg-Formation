import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";
import React from "react";

export default function Contact() {
    return (
        <>
            <div className="flex justify-center items-center  flex-col gap-10 z-50">
                <div className="sticky top-0 z-50">
                    <Nav />
                </div>
                <div className="flex mt-10 justify-center px-3 py-4 flex-col gap-4 border-2 rounded-2xl shadow-lg shadow-zinc-300 border-zinc-900 hover:shadow-xl hover:shadow-zinc-300 transition-all duration-200 ease-in w-md md:w-lg lg:w-4xl xl:w-6xl">
                
                    <h1 className="text-3xl max-md:text-2xl font-bold mb-4  text-center">Contactez-nous</h1>
                    <h2 className="text-lg max-md:text-sm mb-5 text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</h2>
                        
                    

              <div className="grid m-auto grid-cols-2 max-sm:grid-cols-1 gap-2">

                <div className="flex px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Nom</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre nom..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-72 rounded-lg shadow-md"
                      
                    />
                  </label>
                </div>
                
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
                    <span className="!bg-white">Prénom</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre prénom..."
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
              <div className="flex justify-center gap-5 items-center flex-col">
                <div className="flex justify-center px-6">
                  <label className="floating-label  label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Message</span>
                    <textarea
                      name="name"
                      placeholder="Votre message..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full h-40 max-sm:w-3xs md:w-48 lg:w-56 xl:w-2xl rounded-lg shadow-md"
                      
                    />
                  </label>
                  
                </div>
                <Button className=" w-48 ml-3.5 cursor-pointer">
                  
                        Envoyer
                   
                </Button>
                  </div>
                    
                </div>
                <div className="bottom-0 w-screen "><Footer /></div>
            </div>
        </>
    );
}