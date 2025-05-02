'use client';

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ListeStages from "../ui-stage/LiseStage";
import StageFilter from "./StageFilter";






export default function ReservationSection() {
  const { data: session } = useSession();


  const [filters, setFilters] = useState<FilterValues>({
    ville: "",
    departement: "",
    date: null,
    motsCles: "",
  });
  
  const [villesDisponibles, setVillesDisponibles] = useState<string[]>([]);
  
  // Fetch villes (à faire quand ReservationSection se monte)
  useEffect(() => {
    const fetchStages = async () => {
      const res = await fetch("/api/Stage/RecupStage");
      const data = await res.json();
      const villes = Array.from(new Set(data.map((stage) => stage.Ville))).sort();
      setVillesDisponibles(villes);
    };
  
    fetchStages();
  }, []);
    return (
      <section className="flex flex-col gap-5 justify-center items-center">
        {session?.user?.role === "admin" && (
          <div className="mt-4 ">
            <Link href="/admin/add-stage">
              <Button className="cursor-pointer hover:shadow-lg hover:shadow-zinc-300 animation-all duration-200 ease-in" variant="outline">Ajouter un stage</Button>
            </Link>
          </div>
        )}
        <StageFilter
  filters={filters}
  onFilterChange={setFilters}
  onReset={() =>
    setFilters({
      ville: "",
      departement: "",
      date: null,
      motsCles: "",
    })
  }
  villesDisponibles={villesDisponibles}
/>
        <div className="bg-white flex justify-center max-sm:w-sm max-md:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-8xl border-2 rounded-xl hover:shadow-2xl transition duration-300 ease-in-out ">
          <div>
            <ListeStages />
          </div>
        </div>
      </section>
    );
  }
  
  
  

// Compare this snippet from my-app/src/components/ui-reservation/footer.tsx: