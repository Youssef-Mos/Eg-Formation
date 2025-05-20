import React from "react";
import AnimatedCard from "../ui/animatedCard";
import AnimatedSection from "../ui/AnimatedSection";
import { ImagesSliderDemo1 } from "./ui/GrpImg1";
import { ImagesSliderDemo2 } from "./ui/GrpImg2";
import { ImagesSliderDemo3 } from "./ui/GrpImg3";
import { LinkPreview } from "../ui/link-preview";
import { Button } from "../ui/button";



export default function BodyHome () {
    return (
        <>
        <AnimatedSection>
        <div className="flex max-md:flex-col gap-10 xl:text-lg xl:gap-20">
            <AnimatedCard delay={100}>
            <div className="relative gap-3 h-max rounded-2xl flex flex-col justify-center items-center py-2 px-3 text-center md:w-xl lg:w-xs w-52 text-sm lg:text-md  border-2 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-cyan-900 border-zinc-900 "><span className="font-bold text-xl lg:text-xl">Conditions d’éligibilité et inscription au stage</span>
                Pour s’inscrire à un stage :
                <div className="flex flex-col gap-3 mt-2">
                <span>- Votre permis doit être valide (au moins 1 point restant).</span>
               <span> - Un délai d’un an doit s’être écoulé depuis le dernier stage.</span>
               <span> - Préparez les documents nécessaires</span>
            </div></div>
            </AnimatedCard>
            <AnimatedCard delay={200}>
            <div className="relative translate-y-10 gap-3 rounded-2xl h-max flex flex-col justify-center items-center py-2 px-3 md:w-2xs lg:w-xs w-52 text-sm lg:text-md  border-2 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-zinc-700 border-zinc-900 text-center"><span className="font-bold text-lg lg:text-xl">Votre sécurité, notre priorité</span>
            En choisissant notre centre :
            <div className="flex flex-col gap-3 mt-2">

               <span> - Vous bénéficiez de l’expertise d’animateurs certifiés.</span>
                <span>- Nos stages sont conformes aux normes en vigueur et reconnus par l’État.</span>
               <span> - Nous proposons des sessions régulières.</span>
            </div></div>
            </AnimatedCard>
            <AnimatedCard delay={300}>
            <div className="relative translate-y-20 mb-16 gap-3  flex flex-col rounded-2xl justify-center items-center py-2 px-3  md:w-2xs lg:w-xs w-52 text-sm lg:text-md  border-2 border-zinc-900 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-red-900 text-center"><span className="font-bold text-xl lg:text-xl">Vérifiez votre solde de points en quelques clics</span>
            <span>Avant d’envisager un stage de récupération, il est essentiel de connaître le nombre de points restants sur votre permis de conduire. Le gouvernement met à disposition le service officiel {' '}<LinkPreview url="https://www.securite-routiere.gouv.fr/le-permis-points/consulter-son-solde-de-points" className="text-blue-500 underline">Mes Points Permis</LinkPreview>{' '} accessible via FranceConnect.</span>
            
            </div>
            </AnimatedCard>

        </div>
        </AnimatedSection>
        <AnimatedSection>
            <AnimatedCard delay={250}>
                <div className="w-lg md:w-2xl lg:w-4xl mt-10">
                    Pour tout autre renseignement, n'hésitez pas à consulter {' '} <LinkPreview url="https://permisdeconduire.ants.gouv.fr" className="text-blue-500 underline">le site officiel du gouvernement (ANTS)</LinkPreview> {' '}, vous pouvez dès à présent vous inscrire à un stage de récupération de points en ligne ou à nous contacter si vous avez des questions.
                </div>
            </ AnimatedCard>    
            <div className="flex justify-center gap-5 mt-5">
            
            <AnimatedCard delay={350}>
                <a href="/"><Button variant="default" className="cursor-pointer text-md ">Réservez maintenant</Button></a>
            </AnimatedCard>

            <AnimatedCard delay={350}>
                <a href="/contact"><Button variant="outline" className="cursor-pointer  text-md ">Contactez-nous</Button></a>
            </AnimatedCard>
            </div>
        </AnimatedSection>



        
        <div className="flex w-full  ml-20 justify-baseline items-start">
        <AnimatedSection>
            <AnimatedCard delay={400}>
        <div className="flex gap-7 sm:h-full md:h-auto items-center flex-col md:flex-row sm:py-10 sm:px-10  md:px-0 justify-center md:justify-start  text-sm md:text-md lg:text-lg  w-lg md:w-2xl lg:w-4xl rounded-2xl mt-10 h-96 border-2 border-zinc-900">
            <div className="w-80 h-64 mb-3 mt-3 md:ml-10">
            <ImagesSliderDemo1 />
            </div>
            <div className="w-lg mr-7 mx-3.5 my-3.5 indent-4">Notre centre agréé vous propose des stages de sensibilisation à la sécurité routière permettant de récupérer jusqu’à 4 points sur votre permis de conduire. Ces stages, d’une durée de 2 jours consécutifs (14 heures), sont animés par un formateur en sécurité routière et un psychologue, conformément aux dispositions du Code de la route .</div>
        </div>
        </AnimatedCard>
        </AnimatedSection>
        </div>
        

        <div className="flex w-full  mr-20 justify-end items-start">
        <AnimatedSection>
            <AnimatedCard delay={500}>
            <div className="flex items-center sm:h-full md:h-auto flex-col md:flex-row sm:py-10 sm:px-10 md:px-0  justify-center md:justify-end  w-lg md:w-2xl lg:w-4xl text-sm md:text-md lg:text-lg  rounded-2xl mt-10 h-96 border-2 border-zinc-900">
        <div className=" mb-3 mt-3 w-80 h-64  md:ml-10">
            <ImagesSliderDemo2 />
            </div>
            <div className="w-lg  mx-7"> <div className="mb-2 mx-3.5 indent-4">Le système du permis à points vise à responsabiliser les conducteurs. En cas d’infraction, des points sont retirés selon la gravité de la faute. Il est possible de récupérer des points : </div>
            
            <div className="flex flex-col mx-3.5 my-3.5 gap-3 ">
            <span className="indent-8">- Automatiquement : si aucune infraction n’est commise pendant une certaine période.</span>
            <span className="indent-8">- Via un stage volontaire : permettant de récupérer jusqu’à 4 points.</span>
            <span className="indent-8">- Stage obligatoire : pour les jeunes conducteurs en période probatoire.</span></div></div></div>
            </AnimatedCard>
        </AnimatedSection>
        </div>

        <div className="flex w-full  ml-20 justify-baseline items-start">
            <AnimatedSection>
            <AnimatedCard delay={600}>
<div className="flex items-center flex-col sm:h-full md:h-auto md:flex-row sm:py-10 sm:px-10  md:px-0  justify-center md:justify-end w-lg md:w-2xl lg:w-4xl rounded-2xl text-sm md:text-md lg:text-lg mt-10 h-96 border-2 border-zinc-900">
        <div className="mb-3 mt-3 w-80 h-64  md:ml-10">
        <ImagesSliderDemo3 />
        </div>
        <div className="w-lg mx-7"><div className="mb-2 mx-3.5 indent-4">Le stage se compose de deux journées de 7 heures chacune, incluant : </div>
            <div className="flex flex-col mx-3.5 my-3.5 gap-3 ">
            <span className="indent-8">- Des modules sur la sécurité routière et les facteurs de risque.</span>
            <span className="indent-8">- Des discussions interactives pour encourager la prise de conscience.</span>
            <span className="indent-8">- Aucune évaluation finale, mais une attestation de suivi est remise à l’issue du stage, permettant la récupération des points dès le lendemain .</span></div></div></div>
            </AnimatedCard>
        </AnimatedSection>
        </div>
        </>
    )
}
