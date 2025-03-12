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
    <div className="flex flex-col gap-5 w-lg">
        <h1 className='text-4xl font-bold text-center'>Hello World, Welcome on my website</h1>
        <div className="flex gap-5 items-center justify-center">
            <Button variant="default" className='cursor-pointer'>Click Me</Button>
            <Button variant="outline" className='cursor-pointer'>Click Me</Button>
        </div>
    </div>
    <h1>hello worls</h1>
    <Accordion type="single" collapsible>
    <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</>
  );
}