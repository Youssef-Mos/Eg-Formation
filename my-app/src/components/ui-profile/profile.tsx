'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { useSession, signOut } from 'next-auth/react';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Profile({ isOpen, onClose }: ProfileProps) {
  const { data: session } = useSession();

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
            className="relative h-full w-3xl bg-zinc-800 text-white rounded-lg hover:shadow-xl p-6 transition-duration duration-200 ease-in"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Bouton de fermeture */}
            <button className="absolute top-4 right-4 text-white cursor-pointer" onClick={onClose}>
              <X size={24} />
            </button>

            {/* Titre du modal */}
            <h1 className="text-2xl text-center mt-3 mb-6">Profil</h1>

            {session ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg">Bonjour, {session.user.username}</p>
                {/* Tu peux ajouter d'autres informations ici, par exemple l'email */}
                <p className="text-sm text-gray-300">{session.user.email}</p>
                <div className='flex justify-center items-center  h-36 bg-amber-700'>
                    Salut
                </div>
                <Button variant="default" className='cursor-pointer' onClick={() => signOut()}>
                  Se déconnecter
                </Button>
              </div>
            ) : (
              <p className="text-center">Aucune session active.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
