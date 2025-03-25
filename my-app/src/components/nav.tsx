'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import LoginModal from './Login';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Profile from './profile';

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { data: session } = useSession();
  console.log('Session dans Nav:', session);

  // Fermer le menu si la largeur dépasse 768px (md)
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
      <div className="flex sticky mt-7 max-sm:w-sm w-full gap-5 justify-arround items-center z-40">
        {/* Conteneur de la bordure animée */}
        <ul
          className={`bg-zinc-800 flex max-md:justify-around py-2 ${
            isOpen ? 'flex-col h-auto py-4' : 'h-14 transition-all duration-300 ease-in-out'
          } max-sm:justify-center gap-4 items-center max-md:w-md md:w-lg rounded-3xl text-white hover:shadow-xl transition-all duration-300 ease-in-out sm:flex-row md:h-auto`}
        >
          <div className="flex md:mr-28">
            <li className="cursor-pointer px-7 py-2 hover:text-zinc-200 transition duration-300 ease-in-out">Logo</li>
          </div>

          {/* Bouton hamburger */}
          <div className="absolute right-5 top-3.5 sm:hidden transition-all duration-300 ease-in-out cursor-pointer">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <X size={28} className="text-white cursor-pointer transition-all duration-200 ease-in" />
              ) : (
                <Menu size={28} className="text-white cursor-pointer transition-all duration-200 ease-in" />
              )}
            </button>
          </div>

          <div
            className={`flex gap-9 items-center ${
              isOpen ? 'flex-col mt-5 transition-all duration-200 ease-in' : 'hidden sm:flex transition-all duration-200 ease-in'
            }`}
          >
            <Link href="/">
              <li className="hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer">Réservation</li>
            </Link>
            <Link href="/Home">
              <li className="hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer">Home</li>
            </Link>
            <li className={`hover:text-zinc-300 transition duration-200 ease-in-out cursor-pointer ${isOpen ? '' : 'mr-5'}`}>
              Contact
            </li>

            {/* Affichage pour mobile */}
            <div className="sm:hidden flex flex-col gap-5 items-center">
              {!session ? (
                <>
                  <Button variant="default" className="cursor-pointer" onClick={() => setShowSignUp(true)}>
                    Se connecter
                  </Button>
                  <Link href="/register">
                    <Button variant="outline" className="cursor-pointer">S'enregistrer</Button>
                  </Link>
                </>
              ) : (
                <Button variant="default" className="cursor-pointer" onClick={() => setShowProfile(true)}>
                  Profile
                </Button>
              )}
            </div>
          </div>
        </ul>

        {/* Affichage pour desktop */}
        <div className="flex gap-2.5 max-sm:hidden sm:flex-col md:right-2 xl:flex-row lg:flex-row">
          {!session ? (
            <>
              <Button variant="default" className="cursor-pointer" onClick={() => setShowSignUp(true)}>
                Se connecter
              </Button>
              <Link href="/register">
                <Button variant="outline" className="cursor-pointer">S'enregistrer</Button>
              </Link>
            </>
          ) : (
            <Button variant="default" className="cursor-pointer" onClick={() => setShowProfile(true)}>
                  Profile
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSignUp && <LoginModal isOpen={showSignUp} onClose={() => setShowSignUp(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && <Profile isOpen={showProfile} onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </nav>
  );
}
