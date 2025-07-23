import React from "react";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white py-8 mt-10 z-50">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Colonne 1 : Infos */}
          <div>
            <h2 className="max-md:text-center text-xl font-semibold mb-3">À propos</h2>
            <p className="max-md:text-center text-sm text-gray-400">
              Nous proposons des solutions adaptées à vos besoins.
            </p>
          </div>

          {/* Colonne 2 : Liens */}
          <div>
            <h2 className="max-md:text-center text-xl font-semibold mb-3">Liens utiles</h2>
            <ul className="max-md:text-center text-sm text-gray-400 space-y-2">
              <li>
                <Link href="/" className="hover:text-white">Réservation</Link>
              </li>
              <li><a href="/Home" className="hover:text-white">Accueil</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
              <li><a href="/mention-legales" className="hover:text-white">Mentions légales</a></li>
            </ul>
          </div>

          {/* Colonne 3 : Contact */}
          <div className="max-md:text-center">
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-sm text-gray-400">📍 212 rue Marcel Sembat, 59450 Sin-le-Noble</p>
            <p className="text-sm text-gray-400">📧 contact@eg-formations.com</p>
            <p className="text-sm text-gray-400">📞 +33 7 83 37 25 65</p>
          </div>

          {/* Colonne 4 : Réseaux sociaux */}
          <div className="max-md:text-center">
            <h2 className="text-xl font-semibold mb-3">Suivez-nous</h2>
            <div className="flex space-x-4 max-sm:flex max-md:justify-center"> 
              <a href="https://www.facebook.com/people/EG-formations/61577263170261/" target="_blank" className="text-gray-400 hover:text-white"><FaFacebook size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaTwitter size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaInstagram size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaLinkedin size={24} /></a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm mt-10 -mb-5">
          © 2025 - TonSite. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
