'use client';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
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
        // Redirection vers la page d'accueil ou dashboard
        router.push('/');
        // Reset form
        setUsername('');
        setPassword('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative z-10 text-center">
            <motion.div 
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <LogIn className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Bon retour !
            </motion.h1>
            <motion.p 
              className="text-blue-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Connectez-vous à votre compte
            </motion.p>
          </div>
        </div>

        {/* Corps de la page */}
        <motion.div 
          className="p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  id="username"
                  placeholder="Entrez votre nom d'utilisateur"
                  className="w-full pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Entrez votre mot de passe"
                  className="w-full pl-12 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 cursor-pointer" /> : <Eye className="w-5 h-5 cursor-pointer" />}
                </button>
              </div>
            </div>

            {/* Liens d'aide */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:no-underline transition-all duration-200 flex items-center gap-2 group cursor-pointer"
              >
                <KeyRound className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                Mot de passe oublié ?
              </button>
              <Link
                href="/register"
                className="text-green-600 hover:text-green-800 underline underline-offset-2 hover:no-underline transition-all duration-200 flex items-center gap-2 group"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                Créer un compte
              </Link>
            </div>

            {/* Bouton de connexion */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium cursor-pointer rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connexion...
                </div>
              ) : (
                <div className="flex items-center cursor-pointer justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              En vous connectant, vous acceptez nos{' '}
              <Link href="/mention-legales" className="text-blue-600 hover:underline">
                conditions d'utilisation
              </Link>
              {' '}et notre{' '}
              <Link href="/mention-legales" className="text-blue-600 hover:underline">
                politique de confidentialité
              </Link>
            </p>
          </div>

          {/* Lien retour accueil */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}