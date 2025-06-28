import React from "react";
import AnimatedCard from "../ui/animatedCard";
import AnimatedSection from "../ui/AnimatedSection";
import { ImagesSliderDemo1 } from "./ui/GrpImg1";
import { ImagesSliderDemo2 } from "./ui/GrpImg2";
import { ImagesSliderDemo3 } from "./ui/GrpImg3";
import { LinkPreview } from "../ui/link-preview";
import { Button } from "../ui/button";
import { FileCheck, Shield, Search, ChevronRight, CheckCircle } from "lucide-react";

export default function BodyHome () {
    return (
        <>
        <AnimatedSection>
        <div className="flex flex-col md:flex-row gap-5 lg:gap-10 xl:text-lg xl:gap-20">
            <AnimatedCard delay={100}>
            <div className="relative gap-3 h-max rounded-2xl flex flex-col justify-center items-center py-10 px-7 text-center md:w-2xs lg:w-xs sm:w-3xs w-72 text-sm lg:text-md border shadow-lg bg-gradient-to-b from-blue-50 to-white border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-2 rounded-full shadow-md">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl lg:text-xl text-blue-800 mb-2">Conditions pour récupérer ses points</span>
                <p className="text-gray-600 mb-2">Critères à remplir pour votre stage :</p>
                <div className="flex flex-col gap-3 mt-1">
                <span className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />Vérifier que vous êtes éligible à la récupération de 4 points</span>
               <span className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />Un an minimum depuis votre dernier stage</span>
               <span className="flex items-center"><CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />Documents requis : permis, lettre 48N, CNI</span>
            </div></div>
            </AnimatedCard>
            <AnimatedCard delay={200}>
            <div className="relative translate-y-10 gap-3 rounded-2xl h-max flex flex-col justify-center items-center py-10 px-7 md:w-2xs lg:w-xs sm:w-3xs w-72 text-sm lg:text-md border shadow-lg bg-gradient-to-b from-zinc-50 to-white border-zinc-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-3 -right-3 bg-zinc-700 text-white p-2 rounded-full shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg lg:text-xl text-zinc-800 mb-2">Formation certifiée</span>
              <p className="text-gray-600 mb-2">Notre engagement qualité :</p>
            <div className="flex flex-col gap-3 mt-1">
               <span className="flex items-center"><CheckCircle className="w-4 h-4 text-zinc-600 mr-2 flex-shrink-0" />Formateurs experts : psychologue et BAFA</span>
                <span className="flex items-center"><CheckCircle className="w-4 h-4 text-zinc-600 mr-2 flex-shrink-0" />Stages de sensibilisation à la sécurité routière</span>
               <span className="flex items-center"><CheckCircle className="w-4 h-4 text-zinc-600 mr-2 flex-shrink-0" />Centre agréé par la préfecture </span>
            </div></div>
            </AnimatedCard>
            <AnimatedCard delay={300}>
            <div className="relative translate-y-20 mb-16 gap-3 flex flex-col rounded-2xl justify-center items-center py-10 px-7 md:w-2xs lg:w-xs sm:w-3xs w-72 text-sm lg:text-md border shadow-lg bg-gradient-to-b from-rose-50 to-white border-rose-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-md">
                <Search className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl lg:text-xl text-red-500 mb-2">Vérifiez vos points</span>
            <span className="text-gray-600">Avant de vous inscrire, consultez gratuitement votre capital de points sur le service officiel {' '}<LinkPreview url="https://www.securite-routiere.gouv.fr/le-permis-points/consulter-son-solde-de-points" className="text-red-400 hover:text-red-600 font-medium inline-flex items-center">Mes Points Permis <ChevronRight className="w-4 h-4 ml-1" /></LinkPreview>{' '} <br/><br/><span className="">Une connexion sécurisée via FranceConnect vous permet d'accéder à votre situation.</span></span>
            
            </div>
            </AnimatedCard>

        </div>
        </AnimatedSection>
        <AnimatedSection>
    <AnimatedCard delay={250}>
        <div className="max-sm:w-xs w-lg m-auto md:w-2xl lg:w-4xl mt-10 text-gray-700 p-4 bg-gray-50 rounded-lg border border-gray-200">
            Besoin d'informations complémentaires ? Consultez {' '} <LinkPreview url="https://permisdeconduire.ants.gouv.fr" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">le site officiel du gouvernement</LinkPreview> {' '} ou réservez directement votre stage en ligne. Notre équipe reste disponible pour répondre à toutes vos questions et vous accompagner dans votre démarche.
        </div>
    </AnimatedCard>    
    
    {/* Boutons responsive - vertical sur mobile, horizontal sur desktop */}
    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-2 md:gap-5 mt-5">
        <AnimatedCard delay={350}>
            <a href="/"><Button variant="default" className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-white font-medium shadow-md hover:shadow-lg transition-all rounded-lg cursor-pointer text-md w-full sm:w-auto">Réservez maintenant</Button></a>
        </AnimatedCard>

        <AnimatedCard delay={350}>
            <a href="/contact"><Button variant="outline" className="px-6 py-2.5 rounded-lg border border-zinc-300 text-zinc-800 font-medium hover:bg-zinc-100 transition-all cursor-pointer text-md w-full sm:w-auto">Contactez-nous</Button></a>
        </AnimatedCard>
    </div>
</AnimatedSection>

{/* Carte 1 - Centrée sur mobile, alignée à gauche sur desktop */}
<div className="flex w-full justify-center md:ml-20 md:justify-start items-start">
    <AnimatedSection>
        <AnimatedCard delay={400}>
            <div className="flex gap-4 sm:gap-7 items-center flex-col md:flex-row sm:py-6 md:py-10 px-4 sm:px-6 md:px-0 justify-center md:justify-start text-sm md:text-md lg:text-lg w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl rounded-2xl mt-10 min-h-80 md:h-96 bg-gradient-to-br from-teal-100 to-white shadow-lg hover:shadow-xl transition-all border border-teal-100">
                <div className="w-full max-w-xs sm:w-80 h-48 sm:h-56 md:h-64 mb-3 mt-3 md:ml-10 overflow-hidden rounded-xl shadow-md flex-shrink-0">
                    <ImagesSliderDemo1 />
                </div>
                <div className="w-full md:w-xl mx-4 md:mx-10 text-zinc-800">
                    <p className="text-lg sm:text-xl mb-2 mx-2 sm:mx-3.5 font-semibold">Récupérez jusqu'à <span className="text-teal-400">4 points</span> sur votre permis en seulement 2 jours !</p>
                    <p className="text-sm my-2 sm:my-3.5 mx-2 sm:mx-3.5 leading-relaxed">Nos stages de sensibilisation à la sécurité routière, agréés par la Préfecture, se déroulent sur 14 heures consécutives. Encadrés par un binôme pédagogique qualifié (expert en sécurité routière et psychologue), nos formations respectent scrupuleusement le cadre légal du Code de la route pour garantir la restitution de vos points.</p>
                </div>
            </div>
        </AnimatedCard>
    </AnimatedSection>
</div>

{/* Carte 2 - Centrée sur mobile, alignée à droite sur desktop */}
<div className="flex w-full justify-center md:mr-20 md:justify-end items-start">
    <AnimatedSection>
        <AnimatedCard delay={500}>
            <div className="flex gap-4 sm:gap-7 items-center flex-col md:flex-row sm:py-6 md:py-10 px-4 sm:px-6 md:px-0 justify-center md:justify-end w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl text-sm md:text-md lg:text-lg rounded-2xl mt-10 min-h-80 md:h-96 bg-gradient-to-br from-amber-50 to-white shadow-lg hover:shadow-xl transition-all border border-amber-100">
                <div className="w-full max-w-xs sm:w-80 h-48 sm:h-56 md:h-64 mb-3 mt-3 md:ml-10 overflow-hidden rounded-xl shadow-md flex-shrink-0 md:order-first">
                    <ImagesSliderDemo2 />
                </div>
                <div className="w-full md:w-xl mx-4 md:mx-7 text-zinc-800">
                    <div className="mb-2 mx-2 sm:mx-3.5 font-semibold">Le permis à points est conçu pour encourager une <span className="text-amber-400">conduite responsable</span>. Plusieurs options s'offrent à vous pour reconstituer votre capital :</div>
                    <div className="flex flex-col mx-2 sm:mx-3.5 my-2 sm:my-3.5 gap-2 sm:gap-3">
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Récupération automatique : 1 point après 6 mois, ou totalité après 2 ou 3 ans sans infraction</span>
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Stage volontaire : jusqu'à 4 points récupérés immédiatement (limité à un stage par an)</span>
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Stage obligatoire : imposé aux conducteurs en période probatoire ayant commis des infractions graves</span>
                    </div>
                </div>
            </div>
        </AnimatedCard>
    </AnimatedSection>
</div>

{/* Carte 3 - Centrée sur mobile, alignée à gauche sur desktop */}
<div className="flex w-full justify-center md:ml-20 md:justify-start items-start">
    <AnimatedSection>
        <AnimatedCard delay={600}>
            <div className="flex gap-4 sm:gap-7 items-center flex-col md:flex-row sm:py-6 md:py-10 px-4 sm:px-6 md:px-0 justify-center md:justify-end w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl rounded-2xl text-sm md:text-md lg:text-lg mt-10 min-h-80 md:h-96 bg-gradient-to-br from-fuchsia-50 to-white shadow-lg hover:shadow-xl transition-all border border-fuchsia-100">
                <div className="w-full max-w-xs sm:w-80 h-48 sm:h-56 md:h-64 mb-3 mt-3 md:ml-10 overflow-hidden rounded-xl shadow-md flex-shrink-0">
                    <ImagesSliderDemo3 />
                </div>
                <div className="w-full md:w-xl mx-4 md:mx-7 text-zinc-800">
                    <div className="mb-2 mx-2 sm:mx-3.5 font-semibold">Nos stages sont <span className="text-fuchsia-400">interactifs</span> et <span className="text-fuchsia-400">adaptés</span> à tous les profils de conducteurs :</div>
                    <div className="flex flex-col mx-2 sm:mx-3.5 my-2 sm:my-3.5 gap-2 sm:gap-3">
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Alternance de sessions théoriques et d'ateliers pratiques sur les comportements à risque</span>
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Échanges constructifs entre participants et formateurs dans un cadre bienveillant</span>
                        <span className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />Aucun examen final : votre présence active aux 14 heures garantit la récupération de vos points dès le lendemain</span>
                    </div>
                </div>
            </div>
        </AnimatedCard>
    </AnimatedSection>

        </div>
        </>
    )
}