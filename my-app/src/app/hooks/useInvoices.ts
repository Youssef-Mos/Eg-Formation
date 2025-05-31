// hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ReservationData, InvoiceFormData } from '@/types/invoice';

export function useInvoices() {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les réservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/invoice/list');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const data = await response.json();
      setReservations(data.reservations || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Erreur chargement réservations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Générer une facture
  const generateInvoice = useCallback(async (formData: InvoiceFormData) => {
    try {
      const response = await fetch('/api/admin/invoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: formData.reservationId,
          customData: {
            invoiceNumber: formData.invoiceNumber,
            amount: formData.amount,
            customerAddress: formData.customerAddress,
            customerPostalCode: formData.customerPostalCode,
            customerCity: formData.customerCity
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la génération');
      }

      const data = await response.json();
      toast.success(data.message);
      
      // Recharger les données
      await loadReservations();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadReservations]);

  // Envoyer une facture par email
  const sendInvoice = useCallback(async (reservationId: number, customMessage?: string) => {
    try {
      const response = await fetch('/api/admin/invoice/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          customMessage: customMessage?.trim() || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi');
      }

      const data = await response.json();
      toast.success(data.message);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Télécharger une facture
  const downloadInvoice = useCallback(async (reservationId: number) => {
    try {
      const url = `/api/admin/invoice/download?reservationId=${reservationId}`;
      window.open(url, '_blank');
      toast.success('Téléchargement démarré');
    } catch (err) {
      const errorMessage = 'Erreur lors du téléchargement';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Calculer les statistiques
  const stats = {
    totalReservations: reservations.length,
    invoicesIssued: reservations.filter(r => r.hasInvoice).length,
    needsInvoice: reservations.filter(r => r.needsInvoice).length
  };

  return {
    reservations,
    loading,
    error,
    stats,
    loadReservations,
    generateInvoice,
    sendInvoice,
    downloadInvoice
  };
}