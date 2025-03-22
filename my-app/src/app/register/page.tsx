'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import Nav from "@/components/nav";
import { DatePicker } from "@/components/ui-reservation/datapicker";
import { Background } from "@/components/background";
import { DatePickerPermis } from "@/components/ui-reservation/datapicker copy";

export default function Register() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <>
      <div className="flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-300 via-stone-100 to-zinc-200 animate-gradient gap-5 z-50">
        <Background />
        <Nav />
        <div className="border-2 bg-zinc-50 px-10 py-10 rounded-xl mt-4 hover:shadow-2xl transition-all duration-200 ease-in gap-5 w-max max-sm:w-sm md:max-w-3xl lg:max-w-4xl xl:max-w-screen-xl 2xl:max-w-screen-2xl">
          <h1 className="text-2xl md:text-4xl font-bold text-center mt-5 mb-5">
            Créer votre compte :
          </h1>
          {/* Conteneur principal en grid responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-x-16 xl:gap-y-10 items-start">
            {/* Bloc 1 : Informations de contacts */}
            <div className="flex flex-col items-center justify-center gap-4 mt-4">
              <p className="text-xl md:text-2xl font-bold text-center">
                Vos informations de contacts :
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input type="radio" name="radio-1" className="radio-md cursor-pointer" /> 
                  <p>Masculin</p>
                </div>
                <div className="flex gap-2">
                  <input type="radio" name="radio-1" className="radio-md cursor-pointer" /> 
                  <p>Féminin</p>
                </div>
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Nom</span>
                  <input
                    type="text"
                    placeholder="Votre nom..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Prénom</span>
                  <input
                    type="text"
                    placeholder="Votre prénom..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Your Email</span>
                  <input
                    type="text"
                    placeholder="Votre e-mail"
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div>
                <DatePicker onDateChange={(date) => console.log("Date sélectionnée :", date)} />
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Lieu de naissance</span>
                  <input
                    type="text"
                    placeholder="Votre lieu de naissance..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
            </div>

            {/* Bloc 2 : Informations complémentaires */}
            <div className="flex flex-col justify-center items-center gap-3  p-4 rounded">
              <p className="text-xl md:text-2xl font-bold text-center mb-5 md:mb-18 lg:mb-9 xl:mb-18">
                Vos informations complémentaires :
              </p>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Adresse 1</span>
                  <input
                    type="text"
                    placeholder="Votre Adresse 1..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div className="flex gap-5 xl:gap-2">
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Adresse 2</span>
                    <input
                      type="text"
                      placeholder="Votre Adresse 2..."
                      className="bg-zinc-50 xl:text-xs outline-0 text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Adresse 3</span>
                    <input
                      type="text"
                      placeholder="Votre Adresse 3..."
                      className="bg-zinc-50 xl:text-xs outline-0 text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-5 xl:gap-2">
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Code postal</span>
                    <input
                      type="text"
                      placeholder="Votre Code postal..."
                      className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Ville</span>
                    <input
                      type="text"
                      placeholder="Votre Ville..."
                      className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-5 xl:gap-2">
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Téléphone 1</span>
                    <input
                      type="text"
                      placeholder="Votre Téléphone 1..."
                      className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30  rounded-lg shadow-md"
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Téléphone 2</span>
                    <input
                      type="text"
                      placeholder="Votre Téléphone 2..."
                      className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">E-mail</span>
                  <input
                    type="text"
                    placeholder="Votre E-mail..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-46 xl:w-64 rounded-lg shadow-md"
                  />
                </label>
              </div>
            </div>

            {/* Bloc 3A : Informations relatives au permis */}
            <div className="flex flex-col justify-center items-center gap-3  p-4 rounded">
              <p className="text-xl md:text-2xl font-bold text-center xl:mb-20">
                Informations relatives à votre permis :
              </p>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Numéro de permis :</span>
                  <input
                    type="text"
                    placeholder="Votre Numéro de permis..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-46  rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div>
                <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                  <span className="!bg-white">Permis délivré à :</span>
                  <input
                    type="text"
                    placeholder="Votre Permis délivré à..."
                    className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-46   rounded-lg shadow-md"
                  />
                </label>
              </div>
              <div>
                <DatePickerPermis onDateChange={(date) => console.log("Date sélectionnée :", date)} />
              </div>
            </div>

            {/* Bloc 3B : Type de stage */}
            <div className="flex flex-col justify-center items-center gap-1  p-4 rounded">
              <p className="text-xl md:text-2xl font-bold text-center mb-7 xl:mb-27">Type de stage :</p>
              <div className="flex flex-col gap-5 ">
                <div className="flex gap-2">
                  <input type="radio" name="radio-3" className="radio-md cursor-pointer" />
                  <p>Récupération des points</p>
                </div>
                <div className="flex gap-2">
                  <input type="radio" name="radio-3" className="radio-md cursor-pointer" />
                  <p>Permis probatoire (lettre Réf. 48N)</p>
                </div>
                <div className="flex gap-2">
                  <input type="radio" name="radio-3" className="radio-md cursor-pointer" />
                  <p>Alternative aux poursuites pénales</p>
                </div>
                <div className="flex gap-2">
                  <input type="radio" name="radio-3" className="radio-md cursor-pointer" />
                  <p>Peine complémentaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
