'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Eye, EyeOff, LogIn, UserPlus, KeyRound } from 'lucide-react';

import {Input} from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl: string | null;

}

export default function LoginModalResa({ isOpen, onClose, callbackUrl }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      console.log('userser', result);
      
      if (result?.error) {
        setError('Identifiants invalides');
        toast.error('Identifiants invalides.');
      } else {
        toast.success('Connexion réussie !');
        onClose();
        // Reset form
        setUsername('');
        setPassword('');
        if (callbackUrl) {
        window.location.href = callbackUrl;
      }
      }
    } catch (error) {
      setError('Une erreur est survenue');
      toast.error('Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

 const handleForgotPassword = () => {
  router.push('/forgot-password');
};

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError(null);
    setShowPassword(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <button 
                className="absolute cursor-pointer top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200 z-20" 
                onClick={handleClose}
              >
                <X size={20} />
              </button>
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Bon retour !</h1>
                <p className="text-blue-100 text-sm">Connectez-vous à votre compte</p>
              </div>
            </div>

            {/* Corps du modal */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Message d'erreur */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Champ Nom d'utilisateur */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700" htmlFor="username">
                    Nom d'utilisateur
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      id="username"
                      placeholder="Entrez votre nom d'utilisateur"
                      className="w-full pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Champ Mot de passe */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700" htmlFor="password">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Entrez votre mot de passe"
                      className="w-full pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 cursor-pointer" /> : <Eye className="w-4 h-4 cursor-pointer" />}
                    </button>
                  </div>
                </div>

                {/* Liens d'aide */}
                <div className="flex flex-col sm:flex-row  sm:justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:no-underline transition-all duration-200 flex items-center gap-1 group cursor-pointer"
                  >
                    <KeyRound className="w-3  h-3 group-hover:rotate-12 transition-transform duration-200" />
                    Mot de passe oublié ?
                  </button>
                  <a
                    href="/register"
                    className="text-green-600 hover:text-green-800 underline underline-offset-2 hover:no-underline transition-all duration-200 flex items-center gap-1 group"
                  >
                    <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                    Créer un compte
                  </a>
                </div>

                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium cursor-pointer rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Connexion...
                    </div>
                  ) : (
                    <div className="flex items-center cursor-pointer justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Se connecter
                    </div>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  En vous connectant, vous acceptez nos{' '}
                  <a href="/mention-legales" className="text-blue-600 hover:underline">conditions d'utilisation</a>
                  {' '}et notre{' '}
                  <a href="/mention-legales" className="text-blue-600 hover:underline">politique de confidentialité</a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}