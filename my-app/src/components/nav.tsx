'use client';

import React, { Component, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';

export default function Nav () {
  

    const [isOpen, setIsOpen] = useState(false)


    // 🔄 Fermer le menu si la largeur dépasse 768px (md)
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setIsOpen(false);
        }
      };

    window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);


    return (
      <nav>
      <div className="sticky mt-7  flex justify-center items-center z-50">
        {/* Conteneur de la bordure animée */}
        <ul
          className={`relative bg-zinc-800 flex py-2 ${
            isOpen ? 'flex-col h-auto py-4' : 'h-14 transition-all duration-300 ease-in-out'
          } justify-center gap-4 items-center w-lg rounded-3xl text-white hover:shadow-xl transition-all duration-300 ease-in-out md:flex-row md:h-auto`}
        >
          <div className="flex items-start md:mr-28">
            <li className="cursor-pointer px-7 py-2 hover:text-zinc-200 transition duration-300 ease-in-out">Logo</li>
          </div>

          {/* Bouton hamburger */}
          <div className="absolute right-5 top-3 md:hidden transition-all duration-300 ease-in-out">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={28} className="text-white" /> : <Menu size={28} className="text-white" />}
            </button>
          </div>

          <div className={`flex gap-9 items-center ${isOpen ? 'flex-col mt-5' : 'hidden md:flex'}`}>
            <Link href="/">
              <li className="hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer">Réservation</li>
            </Link>
            <Link href="/Home">
              <li className="hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer">Home</li>
            </Link>
            <li className={`hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer ${isOpen ? '' : 'mr-5' }`}>Contact</li>

            <div className="md:hidden flex flex-col gap-5 items-center">
              <Button variant="default" className='cursor-pointer '>Se connecter</Button>
              <Link href="/register">
                <Button variant="outline" className='cursor-pointer bg- transition-all duration-200 ease-in'>S'enregistrer</Button>
              </Link>
            </div>
          </div>
        </ul>

        <div className="flex gap-5 top-10 right-10 fixed  items-center justify-center max-md:hidden md:flex-col md:right-2 lg:right-10 md:top-5 xl:flex-row xl:top-10">
        <Button variant="default" className='cursor-pointer '>Se connecter</Button>
        <Link href="/register">
        <Button variant="outline" className='cursor-pointer '>S'enregistrer</Button>
        </Link>
        </div>
      </div>
      
      </nav>
    );
  
}


