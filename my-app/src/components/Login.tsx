'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from './ui/button';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Appel à NextAuth avec le provider "credentials"
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Identifiants invalides.');
    } else {
      // Connexion réussie, on peut fermer la modal
      setError(null);
      onClose();
    }
  };
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
            className="relative w-xs h-96 bg-zinc-800 text-white rounded-lg shadow-lg p-6"
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
            <h1 className="text-2xl text-center mt-3 mb-6">Se connecter</h1>

            {error && (
              <p className="text-center text-red-500 mb-4">{error}</p>
            )}

            {/* Champ Nom d'utilisateur */}
            <form onSubmit={handleSubmit}>
              <Label className="block mb-2" htmlFor="username">
                Nom d'utilisateur
              </Label>
              <Input
                type="text"
                id="username"
                placeholder="Nom d'utilisateur"
                className="w-full mb-4"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <Label className="block mb-2" htmlFor="password">
                Mot de passe
              </Label>
              <Input
                type="password"
                id="password"
                placeholder="Mot de passe"
                className="w-full mb-0.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="text-end text-[11px]">
                <a
                  className="text underline underline-offset-1 cursor-pointer hover:no-underline transition-all duration-300 ease-in"
                  href="/register"
                >
                  Vous n'avez pas encore de compte ?
                </a>
              </div>

              <Button
                variant="default"
                className="w-full mt-12 cursor-pointer"
                type="submit"
              >
                Se connecter
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
  );
}

