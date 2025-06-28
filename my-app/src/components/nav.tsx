'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import LoginModal from './Login';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Profile from './ui-profile/profile';
import ProfileButton from './ui-profile/ProfileButton';
import { AnimatedProfileButton } from './ui-profile/ProfileAnimateButton';

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  // Rendu initial identique serveur/client
  if (!isMounted) {
    return (
      <nav className=''>
        <div className="flex sticky max-sm:w-xs mt-7 w-full gap-3 sm:gap-5 justify-center items-center z-40 px-4">
          <ul className="bg-zinc-800 flex justify-between py-2 h-14 items-center w-full max-w-2xl rounded-3xl text-white hover:shadow-lg hover:shadow-zinc-400 transition-all duration-300 ease-in-out relative">
            {/* Logo */}
            <div className="flex-shrink-0 pl-4">
              <li className="cursor-pointer text-nowrap py-2 group transition duration-300 ease-in-out">
                <span className='font-bold text-lg tracking-wide'>
                  <span className='text-blue-400'>EG-FO</span>
                  <span className='text-white'>RMAT</span>
                  <span className='text-red-500'>IONS</span>
                </span>
              </li>
            </div>

            {/* Bouton hamburger */}
            <div className="absolute right-4 sm:hidden cursor-pointer">
              <button onClick={() => setIsOpen(!isOpen)}>
                <Menu size={24} className="text-white cursor-pointer transition-all duration-200 ease-in" />
              </button>
            </div>

            {/* Navigation desktop */}
            <div className="hidden sm:flex items-center gap-2 md:gap-4 pr-4">
              <Link href="/">
                <li className="hover:text-blue-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Réservation</li>
              </Link>
              <Link href="/Home">
                <li className="hover:text-zinc-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Home</li>
              </Link>
              <Link href="/contact">
                <li className="hover:text-red-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Contact</li>
              </Link>
            </div>
          </ul>

          {/* Boutons desktop */}
          <div className="hidden sm:flex sm:flex-col lg:flex-row gap-2 flex-shrink-0">
            <Button variant="default" className="cursor-pointer hover:scale-105 transition-all duration-200 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 font-medium text-sm w-full lg:w-auto">Se connecter</Button>
            <Link href="/register">
              <Button variant="outline" className="cursor-pointer hover:scale-105 transition-all duration-200 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25 font-medium text-sm w-full lg:w-auto">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Rendu complet après hydratation
  return (
    <nav className=''>
      <div className="flex sticky mt-7 max-sm:w-xs w-full gap-3 sm:gap-5 justify-center items-center z-40 px-4">
        <ul
          className={`bg-zinc-800 flex py-2 items-center rounded-3xl text-white hover:shadow-lg hover:shadow-zinc-400 transition-all duration-300 ease-in-out relative ${
            isOpen 
              ? 'flex-col w-full max-w-lg py-6 gap-5' 
              : 'justify-between h-14 w-full max-w-2xl'
          }`}
        >
          {/* Logo */}
          <Link href="/" className={`flex-shrink-0 ${isOpen ? '' : 'pl-4'}`}>
            <li className="cursor-pointer text-nowrap py-2 group transition-all duration-300 ease-in-out hover:scale-105">
              <span className='font-bold text-lg tracking-wide transition-all duration-300 ease-in-out'>
                <span className='text-blue-400 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-all duration-300 ease-in-out'>EG-FO</span>
                <span className='text-white group-hover:text-zinc-200 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300 ease-in-out'>RMAT</span>
                <span className='text-red-500 group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-300 ease-in-out'>IONS</span>
              </span>
            </li>
          </Link>

          {/* Bouton hamburger */}
          <div className={`absolute right-4 sm:hidden cursor-pointer ${isOpen ? 'top-4' : ''}`}>
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <X size={24} className="text-white cursor-pointer transition-all duration-200 ease-in" />
              ) : (
                <Menu size={24} className="text-white cursor-pointer transition-all duration-200 ease-in" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div
            className={`flex items-center ${
              isOpen 
                ? 'flex-col gap-4 w-sm' 
                : 'hidden sm:flex gap-2 md:gap-4 pr-4'
            }`}
          >
            <Link href="/">
              <li className="hover:text-blue-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Réservation</li>
            </Link>
            <Link href="/Home">
              <li className="hover:text-zinc-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Home</li>
            </Link>
            <Link href="/contact">
              <li className="hover:text-red-400 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer font-medium px-2 md:px-3 py-2 rounded-lg hover:bg-zinc-700/50 text-sm md:text-base whitespace-nowrap">Contact</li>
            </Link>

            {/* Navigation mobile - boutons */}
            {isOpen && (
              <div className="flex flex-col gap-4 items-center mt-4 w-full px-4">
                {!session ? (
                  <>
                    <Button variant="default" className="cursor-pointer hover:scale-105 transition-all duration-200 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 font-medium w-48" onClick={() => setShowSignUp(true)}>
                      Se connecter
                    </Button>
                    <Link href="/register" className="w-48">
                      <Button variant="outline" className="cursor-pointer hover:scale-105 transition-all duration-200 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25 font-medium w-full">S'inscrire</Button>
                    </Link>
                  </>
                ) : (
                  <ProfileButton username={session.user.username} />
                )}
              </div>
            )}
          </div>
        </ul>

        {/* Boutons desktop */}
        {!isOpen && (
          <div className="hidden sm:flex sm:flex-col lg:flex-row gap-2 flex-shrink-0">
            {!session ? (
              <>
                <Button variant="default" className="cursor-pointer hover:scale-105 transition-all duration-200 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 font-medium text-sm w-full lg:w-auto" onClick={() => setShowSignUp(true)}>
                  Se connecter
                </Button>
                <Link href="/register">
                  <Button variant="outline" className="cursor-pointer hover:scale-105 transition-all duration-200 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25 font-medium text-sm w-full lg:w-auto">S'inscrire</Button>
                </Link>
              </>
            ) : (
              <AnimatedProfileButton />
            )}
          </div>
        )}
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