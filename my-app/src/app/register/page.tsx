'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import Nav from "@/components/nav";
import { DatePicker } from "@/components/ui-reservation/datapicker";
import { Background } from "@/components/background";
import { DatePickerPermis } from "@/components/ui-reservation/datapicker copy";

export default function Register() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const [formData, setFormData] = React.useState({
    gender: '',
    lastName: '',
    firstName: '',
    name: '',
    birthDate: new Date(),
    birthPlace: '',
    address1: '',
    address2: '',
    address3: '',
    postalCode: '',
    city: '',
    phone1: '',
    phone2: '',
    email: '',
    permitNumber: '',
    permitIssuedAt: '',
    permitDate: new Date(),
    username: '',
    password: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      // Conversion des dates en ISO string
      const dataToSend = {
        ...formData,
        birthDate: formData.birthDate.toISOString(),
        permitDate: formData.permitDate.toISOString()
      };
  
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });
  
      if (!response.ok) {
        throw new Error('Erreur HTTP: ' + response.status);
      }
  
      const result = await response.json();
      console.log('Utilisateur créé:', result);
      alert('Inscription réussie !');
      
  
    } catch (error) {
      console.error('Erreur:', error);
      alert("Échec de l'inscription");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center bg-gradient-to-tr from-zinc-300 via-stone-100 to-zinc-200 animate-gradient gap-5 z-50">
        <Nav /> 
        <div className="h-screen">
          <form onSubmit={handleSubmit}>
          <div className="border-2 bg-zinc-50 px-10 py-10 rounded-xl mt-4 hover:shadow-2xl transition-all duration-200 ease-in gap-5 w-max max-sm:w-sm md:max-w-3xl lg:max-w-4xl xl:max-w-screen-xl 2xl:max-w-screen-2xl">
            <h1 className="text-2xl md:text-4xl font-bold text-center mt-5 mb-5">
              Créer votre compte :
            </h1>
            {/* Conteneur principal en grid responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-x-16 xl:gap-y-10 items-start">
              {/* Bloc 1 : Informations de contacts */}
              <div className="flex flex-col items-center justify-center gap-4 mt-4">
                <p className="text-xl md:text-2xl font-bold text-center">
                  Vos informations de contacts :
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer"  
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})} /> 
                    <p>Masculin</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="radio" 
                      name="gender" 
                      className="radio-md cursor-pointer"  
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}  /> 
                    <p>Féminin</p>
                  </div>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Nom *</span>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Votre nom..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Prénom *</span>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Votre prénom..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Nom d'usage</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Votre nom d'usage..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </label>
                </div>
                <div>
                  <DatePicker onDateChange={(date) => setFormData({...formData, birthDate: date})} />
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Lieu de naissance *</span>
                    <input
                      type="text"
                      name="birthPlace"
                      placeholder="Votre lieu de naissance..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                      value={formData.birthPlace}
                      onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Bloc 2 : Informations complémentaires */}
              <div className="flex flex-col justify-center items-center gap-3 p-4 rounded">
                <p className="text-xl md:text-2xl font-bold text-center mb-5 md:mb-18 lg:mb-9 xl:mb-18">
                  Vos informations complémentaires :
                </p>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Adresse 1 *</span>
                    <input
                      type="text"
                      name="address1"
                      placeholder="Votre Adresse 1..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                      value={formData.address1}
                      onChange={(e) => setFormData({...formData, address1: e.target.value})}
                      required
                    />
                  </label>
                </div>
                <div className="flex gap-5 xl:gap-2">
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Adresse 2</span>
                      <input
                        type="text"
                        name="address2"
                        placeholder="Votre Adresse 2..."
                        className="bg-zinc-50 xl:text-xs outline-0 text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.address2}
                        onChange={(e) => setFormData({...formData, address2: e.target.value})}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Adresse 3</span>
                      <input
                        type="text"
                        name="address3"
                        placeholder="Votre Adresse 3..."
                        className="bg-zinc-50 xl:text-xs outline-0 text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.address3}
                        onChange={(e) => setFormData({...formData, address3: e.target.value})}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-5 xl:gap-2">
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Code postal *</span>
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="Votre Code postal..."
                        className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Ville *</span>
                      <input
                        type="text"
                        name="city"
                        placeholder="Votre Ville..."
                        className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-5 xl:gap-2">
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Téléphone 1 *</span>
                      <input
                        type="text"
                        name="phone1"
                        placeholder="Votre Téléphone 1..."
                        className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.phone1}
                        onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Téléphone 2</span>
                      <input
                        type="text"
                        name="phone2"
                        placeholder="Votre Téléphone 2..."
                        className="bg-zinc-50 outline-0 xl:text-xs text-zinc-900 input w-full sm:w-40 md:w-36 xl:w-30 rounded-lg shadow-md"
                        value={formData.phone2}
                        onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                      />
                    </label>
                  </div>
                </div>
                
              </div>
              
              {/* Bloc 3A : Informations relatives au permis */}
              <div className="flex flex-col justify-center items-center gap-3 p-4 rounded">
                <p className="text-xl md:text-2xl font-bold text-center xl:mb-6">
                  Informations relatives à votre permis :
                </p>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Numéro de permis *</span>
                    <input
                      type="text"
                      name="permitNumber"
                      placeholder="Votre Numéro de permis..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-46 rounded-lg shadow-md"
                      value={formData.permitNumber}
                      onChange={(e) => setFormData({...formData, permitNumber: e.target.value})}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                    <span className="!bg-white">Permis délivré à *</span>
                    <input
                      type="text"
                      name="permitIssuedAt"
                      placeholder="Votre Permis délivré à..."
                      className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-46 rounded-lg shadow-md"
                      value={formData.permitIssuedAt}
                      onChange={(e) => setFormData({...formData, permitIssuedAt: e.target.value})}
                      required
                    />
                  </label>
                </div>
                <div>
                  <DatePickerPermis onDateChange={(date) => setFormData({...formData, permitDate: date})} />
                </div>
              </div>
              
              {/* Bloc 3B : Informations concernant votre compte */}
              <div className="flex flex-col justify-center items-center gap-1 p-4 rounded">
                <p className="text-xl md:text-2xl font-bold text-center mb-7 xl:mb-6">
                  Informations concernant votre compte :
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Pseudo *</span>
                      <input
                        type="text"
                        name="username"
                        placeholder="Votre pseudo..."
                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">E-mail *</span>
                      <input
                        type="text"
                        name="email"
                        placeholder="Votre e-mail..."
                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label className="floating-label label bg-white text-zinc-900 rounded-lg border border-gray-300">
                      <span className="!bg-white">Mot de passe *</span>
                      <input
                        type="password"
                        name="password"
                        placeholder="Votre mot de passe..."
                        className="bg-zinc-50 outline-0 text-zinc-900 input w-full sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-lg shadow-md"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Button className="mt-10 cursor-pointer">S'enregistrer</Button>
            </div>
          </div>
          </form>
        </div>
      </div>
    </>
  );
}
