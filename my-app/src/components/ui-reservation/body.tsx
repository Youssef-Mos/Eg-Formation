"use client"
import 'react';
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import ReservationSection from './reservation-section';

export const Body = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  return (
<>
    <div className="flex flex-col gap-4 w-full border-b-2 border-zinc-500 pb-5">
        <h1 className='text-4xl font-bold text-center'>Bienvenue sur <span className='bg-gradient-to-r from-indigo-600 via-blue-300 to-red-600 animate-gradient-mid bg-clip-text text-transparent '>Eg-Formation</span></h1>
        <h1 className='text-2xl font-bold text-center mx-3 '>Récupérez jusqu&aposà <span className="text-red-400">4 points</span>  sur votre permis en quelques clics et en suivant ces <span className="text-blue-400">3 étapes </span> :</h1>
        
          <Accordion type="single" collapsible className="max-w-md mx-auto mb-4 ">
            <AccordionItem value="item-1">
              <AccordionTrigger className='mx-4 md:mx-auto cursor-pointer'>🗓️ Trouvez un stage</AccordionTrigger>
                <AccordionContent className='mx-4 md:mx-auto'>
                  Recherchez un stage disponible près de chez vous en quelques clics.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className='mx-4 md:mx-auto cursor-pointer'>💳 Réservez en ligne</AccordionTrigger>
               <AccordionContent className='mx-4 md:mx-auto'>
                Inscrivez-vous et payez en toute sécurité depuis notre plateforme.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className='mx-4 md:mx-auto cursor-pointer'>📜 Récupérez vos points</AccordionTrigger>
                <AccordionContent className='mx-4 md:mx-auto'>
                  Une fois le stage terminé, vous récupérez jusqu&aposà 4 points sur votre permis !
                </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex gap-5 items-center justify-center">
            <Button onClick={() => scrollToSection("stageResa")} variant="default" className='cursor-pointer' >Réserve ton stage</Button>
            <a href='/Home'><Button variant="outline" className='cursor-pointer'>En savoir plus</Button></a>
        </div>
    </div>
    <span id='stageResa'></span>
    <ReservationSection />
    
    
    
</>
  );
}