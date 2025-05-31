// hooks/useAgrements.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Agrement {
  id: number;
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
  _count?: {
    stages: number;
  };
}

export interface UseAgrementsReturn {
  agrements: Agrement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAgrement: (data: Omit<Agrement, 'id' | '_count'>) => Promise<boolean>;
  deleteAgrement: (id: number) => Promise<boolean>;
}

export function useAgrements(): UseAgrementsReturn {
  const [agrements, setAgrements] = useState<Agrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la liste des agréments
  const fetchAgrements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agrements');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du chargement des agréments');
      }

      setAgrements(data.agrements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors du chargement des agréments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un nouvel agrément
  const createAgrement = useCallback(async (data: Omit<Agrement, 'id' | '_count'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/agrements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        toast.error(responseData.message || 'Erreur lors de la création de l\'agrément');
        return false;
      }

      toast.success('Agrément créé avec succès');
      await fetchAgrements(); // Recharger la liste
      return true;
    } catch (err) {
      console.error('Erreur lors de la création de l\'agrément:', err);
      toast.error('Erreur réseau lors de la création de l\'agrément');
      return false;
    }
  }, [fetchAgrements]);

  // Supprimer un agrément
  const deleteAgrement = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agrements/${id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        toast.error(responseData.message || 'Erreur lors de la suppression de l\'agrément');
        return false;
      }

      toast.success('Agrément supprimé avec succès');
      await fetchAgrements(); // Recharger la liste
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'agrément:', err);
      toast.error('Erreur réseau lors de la suppression de l\'agrément');
      return false;
    }
  }, [fetchAgrements]);

  // Charger les agréments au montage du composant
  useEffect(() => {
    fetchAgrements();
  }, [fetchAgrements]);

  return {
    agrements,
    loading,
    error,
    refetch: fetchAgrements,
    createAgrement,
    deleteAgrement,
  };
}

// Hook utilitaire pour trouver un agrément par ID
export function useAgrementById(id: number | undefined): Agrement | null {
  const { agrements, loading } = useAgrements();
  
  if (loading || !id) return null;
  
  return agrements.find(agrement => agrement.id === id) || null;
}