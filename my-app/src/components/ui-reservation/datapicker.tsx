"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ onDateChange }: { onDateChange: (date: Date | undefined) => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    onDateChange(date)
    // Ferme le popover automatiquement une fois la date sélectionnée
    setIsPopoverOpen(false)
  }

  return (
    <div className="flex flex-col space-y-2 cursor-pointer ">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-[240px] cursor-pointer pl-3 text-left font-normal bg-zinc-50 shadow-lg ${!selectedDate && "text-muted-foreground"}`}
            onClick={() => setIsPopoverOpen(true)}
          >
            {selectedDate ? format(selectedDate, "PPP") : <span> Votre date de naissance</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 " align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
            // Si ton composant Calendar supporte une prop pour activer la sélection rapide d'année,
            // ce serait le bon endroit pour l'ajouter. Par exemple :
            // showMonthYearPicker={true}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
