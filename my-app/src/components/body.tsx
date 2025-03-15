import 'react';
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const Body = () => {
  return (
<>
    <div className="flex flex-col gap-5 w-full">
        <h1 className='text-4xl font-bold text-center'>Bienvenue sur <span className='bg-gradient-to-r from-indigo-600 via-blue-300 to-red-600 animate-gradient-mid bg-clip-text text-transparent '>Eg-Formation</span></h1>
        <h1 className='text-2xl font-bold text-center'>Découvrez nos stages de récupération de points</h1>
        <div className="flex gap-5 items-center justify-center">
            <Button variant="default" className='cursor-pointer'>Réserve ton stage</Button>
            <Button variant="outline" className='cursor-pointer'>Click Me</Button>
        </div>
    </div>
    
    
</>
  );
}