'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Shield, 
  Trash2, 
  Plus,
  Search,
  MapPin,
  Hash,
  AlertTriangle,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import AddAgrement from "./AddAgrements"; // Garde ton import existant

interface Agrement {
  id: number;
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
  _count?: {
    stages: number;
  };
}

interface AgrementManagementProps {
  onClose?: () => void; // Optionnel si utilisé dans une page dédiée
}

export default function AgrementManagement({ onClose }: AgrementManagementProps) {
  const [agrements, setAgrements] = useState<Agrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Charger la liste des agréments
  const loadAgrements = async () => {
    try {
      setLoading(true);
      // CORRECTION 1: Utilise la bonne route API
      const res = await fetch("/api/agrements");
      
      if (res.ok) {
        const data = await res.json();
        // CORRECTION 2: Vérifier que data est un tableau
        if (Array.isArray(data)) {
          setAgrements(data);
        } else {
          console.error("Format de données inattendu:", data);
          setAgrements([]);
          toast.error("Format de données inattendu");
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors du chargement des agréments");
        setAgrements([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des agréments:", error);
      toast.error("Erreur réseau lors du chargement des agréments");
      setAgrements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgrements();
  }, []);

  // Supprimer un agrément
  const handleDelete = async (agrementId: number, agrementNom: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'agrément "${agrementNom}" ?`)) {
      return;
    }

    try {
      setDeleteLoading(agrementId);
      // CORRECTION 3: Utilise la bonne route API
      const res = await fetch(`/api/agrements/${agrementId}`, {
        method: "DELETE",
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success("Agrément supprimé avec succès");
        loadAgrements(); // Recharger la liste
      } else {
        toast.error(responseData.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur réseau lors de la suppression");
    } finally {
      setDeleteLoading(null);
    }
  };

  // CORRECTION 4: Filtrer les agréments avec protection contre undefined
  const filteredAgrements = (agrements || []).filter(agrement =>
    agrement.departement.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agrement.numeroAgrement.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agrement.nomDepartement && agrement.nomDepartement.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAgrementAdded = () => {
    loadAgrements();
    setShowAddModal(false);
    toast.success("Agrément ajouté avec succès");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des agréments</h1>
            <p className="text-gray-600">Gérez les agréments par département</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvel agrément
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher par département, numéro d'agrément..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Liste des agréments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Chargement des agréments...</p>
          </div>
        ) : filteredAgrements.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              {searchTerm ? "Aucun agrément trouvé" : "Aucun agrément configuré"}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm ? "Essayez avec d'autres termes de recherche" : "Commencez par ajouter un nouvel agrément"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAgrements.map((agrement, index) => (
              <motion.div
                key={agrement.id}
                className="p-6 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {agrement.departement}
                          {agrement.nomDepartement && (
                            <span className="text-gray-600 font-normal ml-2">
                              ({agrement.nomDepartement})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">{agrement.numeroAgrement}</span>
                        </div>
                      </div>
                    </div>
                    
                    {agrement._count && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {agrement._count.stages > 0 
                            ? `${agrement._count.stages} stage(s) utilise(nt) cet agrément`
                            : "Aucun stage n'utilise cet agrément"
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {agrement._count && agrement._count.stages > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full text-xs text-orange-700">
                        <AlertTriangle className="w-3 h-3" />
                        En utilisation
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(agrement.id, `${agrement.departement} (${agrement.numeroAgrement})`)}
                      disabled={deleteLoading === agrement.id || (agrement._count && agrement._count.stages > 0)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteLoading === agrement.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CORRECTION 5: Statistiques avec protection contre undefined */}
      {!loading && agrements && agrements.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total agréments</p>
                <p className="text-2xl font-bold text-blue-800">{agrements?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Agréments actifs</p>
                <p className="text-2xl font-bold text-green-800">
                  {agrements?.filter(a => a._count && a._count.stages > 0).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Stages totaux</p>
                <p className="text-2xl font-bold text-gray-800">
                  {agrements?.reduce((sum, a) => sum + (a._count?.stages || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'agrément */}
      {showAddModal && (
        <AddAgrement
          onClose={() => setShowAddModal(false)}
          onAgrementAdded={handleAgrementAdded}
        />
      )}
    </div>
  );
}