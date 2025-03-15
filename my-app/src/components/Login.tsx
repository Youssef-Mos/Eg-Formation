'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from './ui/button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop semi-transparent avec fade-in/out
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Conteneur du modal avec zoom-in/out */}
          <motion.div
            className="relative w-[350px] bg-zinc-800 text-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Bouton de fermeture */}
            <button className="absolute top-4 right-4 text-white cursor-pointer" onClick={onClose}>
              <X size={24} />
            </button>

            {/* Titre */}
            <h1 className="text-2xl text-center mb-6">Se connecter</h1>

            {/* Champ Nom d'utilisateur */}
            <Label className="block mb-2" htmlFor="username">
              Nom d'utilisateur
            </Label>
            <Input type="text" placeholder="Nom d'utilisateur" className="w-full mb-4" />

            {/* Champ Mot de passe */}
            <Label className="block mb-2" htmlFor="password">
              Mot de passe
            </Label>
            <Input type="password" placeholder="Mot de passe" className="w-full mb-0.5" />
            
            {/* Lien vers la page d'inscription */}
            <div className='text-end text-[11px]'>
              <a className="text underline underline-offset-1 cursor-pointer hover:no-underline transition-all duration-300 ease-in" href='/register'>
                Vous n'avez pas encore de compte ?
              </a>
            </div>

            {/* Bouton Se connecter */}
            <Button variant="default" className="w-full mt-6 cursor-pointer">Se connecter</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

