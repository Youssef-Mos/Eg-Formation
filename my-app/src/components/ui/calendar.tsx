"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month,
  onMonthChange,
  selected,
  onSelect,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const [isPickerOpen, setIsPickerOpen] = React.useState<'month' | 'year' | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(month || new Date())
  const [yearRangeStart, setYearRangeStart] = React.useState<number>(
    new Date().getFullYear() - 6
  )

  React.useEffect(() => {
    if (month) setCurrentMonth(month)
  }, [month])

  React.useEffect(() => {
    if (!month && selected) {
      const newMonth = new Date(selected.getFullYear(), selected.getMonth(), 1)
      setCurrentMonth(newMonth)
    }
  }, [selected, month])

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date)
    onMonthChange?.(date)
  }

  const handleMonthNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1))
    handleMonthChange(newDate)
  }

  const handleYearNavigation = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -12 : 12
    setYearRangeStart(prev => Math.max(1930, prev + offset))
  }

  const CustomCaption = (captionProps: { displayMonth: Date }) => {
    return (
      <div className="flex items-center justify-center gap-1 mb-4">
        <button
          onClick={() => handleMonthNavigation('prev')}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100 cursor-pointer"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsPickerOpen(prev => prev === 'month' ? null : 'month')}
            className="px-3 py-1 text-sm font-medium hover:bg-accent rounded-md cursor-pointer"
          >
            {captionProps.displayMonth.toLocaleString('default', { month: 'long' })}
          </button>
          <button
            onClick={() => {
              setYearRangeStart(Math.max(1930, captionProps.displayMonth.getFullYear() - 6))
              setIsPickerOpen(prev => prev === 'year' ? null : 'year')
            }}
            className="px-3 py-1 text-sm font-medium hover:bg-accent rounded-md cursor-pointer"
          >
            {captionProps.displayMonth.getFullYear()}
          </button>
        </div>

        <button
          onClick={() => handleMonthNavigation('next')}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100 cursor-pointer"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn("p-3", className)}>
      {isPickerOpen ? (
        isPickerOpen === 'month' ? (
          <div className="grid grid-cols-3 gap-2 ">
            {Array.from({ length: 12 }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(i)
                  handleMonthChange(newDate)
                  setIsPickerOpen(null)
                }}
                className={cn(
                  "p-2 text-sm rounded-md hover:bg-accent cursor-pointer",
                  i === currentMonth.getMonth() && "bg-primary  hover:bg-zinc-800 text-primary-foreground "
                )}
              >
                {new Date(0, i).toLocaleString('default', { month: 'short' })}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center " >
              <button
                onClick={() => handleYearNavigation('prev')}
                disabled={yearRangeStart <= 1930}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "size-7 p-0 cursor-pointer",
                  yearRangeStart <= 1930 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium">
                {yearRangeStart} - {yearRangeStart + 11}
              </span>
              <button
                onClick={() => handleYearNavigation('next')}
                className={buttonVariants({ variant: "ghost" }) + " size-7 p-0 cursor-pointer"}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const year = yearRangeStart + i
                return (
                  <button
                    key={year}
                    onClick={() => {
                      const newDate = new Date(currentMonth)
                      newDate.setFullYear(year)
                      handleMonthChange(newDate)
                      setIsPickerOpen(null)
                    }}
                    className={cn(
                      "p-2 text-sm rounded-md hover:bg-accent cursor-pointer",
                      year === currentMonth.getFullYear() && "bg-primary hover:bg-zinc-800 text-primary-foreground",
                      year < 1930 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={year < 1930}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </div>
        )
      ) : (
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          selected={selected}
          onSelect={onSelect}
          classNames={{
            months: "flex flex-col sm:flex-row gap-2 ",
            month: "flex flex-col gap-4 ",
            caption: "hidden",
            nav: "flex items-center gap-1 ",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-x-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent ",
              props.mode === "range"
                ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md"
                : "[&:has([aria-selected])]:rounded-md"
            ),
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0 font-normal aria-selected:opacity-100  cursor-pointer"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-zinc-800 hover:text-zinc-100",
            day_today: "bg-accent text-accent-foreground",
            ...classNames,
          }}
          components={{
            IconLeft: ({ className, ...props }) => (
              <ChevronLeft className={cn("size-4", className)} {...props} />
            ),
            IconRight: ({ className, ...props }) => (
              <ChevronRight className={cn("size-4", className)} {...props} />
            ),
            Caption: CustomCaption
          }}
          {...props}
        />
      )}
    </div>
  )
}

export { Calendar }