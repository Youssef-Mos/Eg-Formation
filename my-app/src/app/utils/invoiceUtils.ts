// utils/invoiceUtils.ts

/**
 * Génère un numéro de facture unique
 * Format: PAP/YYYY/MM/XXXXX
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-5);
  return `PAP/${year}/${month}/${timestamp}`;
}

/**
 * Valide un numéro de facture
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^PAP\/\d{4}\/\d{2}\/\d{5}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

/**
 * Formate un montant en euros
 */
export function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} €`;
}

/**
 * Formate le nom complet d'un client
 */
export function formatCustomerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Formate l'adresse complète d'un client
 */
export function formatCustomerAddress(
  address: string, 
  postalCode: string, 
  city: string
): string {
  const parts = [address, `${postalCode} ${city}`].filter(Boolean);
  return parts.join(', ');
}

/**
 * Valide les données d'une facture
 */
export function validateInvoiceData(data: {
  invoiceNumber: string;
  amount: number;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.invoiceNumber.trim()) {
    errors.push('Le numéro de facture est requis');
  } else if (!isValidInvoiceNumber(data.invoiceNumber)) {
    errors.push('Le format du numéro de facture est invalide');
  }

  if (!data.amount || data.amount <= 0) {
    errors.push('Le montant doit être supérieur à 0');
  }

  if (!data.customerAddress.trim()) {
    errors.push('L\'adresse du client est requise');
  }

  if (!data.customerPostalCode.trim()) {
    errors.push('Le code postal est requis');
  } else if (!/^\d{5}$/.test(data.customerPostalCode)) {
    errors.push('Le code postal doit contenir 5 chiffres');
  }

  if (!data.customerCity.trim()) {
    errors.push('La ville est requise');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Génère un nom de fichier pour le téléchargement
 */
export function generateDownloadFilename(invoiceNumber: string): string {
  return `facture_${invoiceNumber.replace(/\//g, '_')}.pdf`;
}

/**
 * Vérifie si une réservation peut être facturée
 */
export function canGenerateInvoice(reservation: {
  paid: boolean;
  hasInvoice?: boolean;
}): { canGenerate: boolean; reason?: string } {
  if (!reservation.paid) {
    return {
      canGenerate: false,
      reason: 'La réservation n\'est pas payée'
    };
  }

  return { canGenerate: true };
}

/**
 * Calcule les statistiques de facturation
 */
export function calculateInvoiceStats(reservations: Array<{
  hasInvoice: boolean;
  needsInvoice: boolean;
  invoice?: { amount: number } | null;
}>) {
  const total = reservations.length;
  const invoiced = reservations.filter(r => r.hasInvoice).length;
  const pending = reservations.filter(r => r.needsInvoice).length;
  
  const totalAmount = reservations
    .filter(r => r.invoice)
    .reduce((sum, r) => sum + (r.invoice?.amount || 0), 0);

  const invoicedPercentage = total > 0 ? Math.round((invoiced / total) * 100) : 0;

  return {
    total,
    invoiced,
    pending,
    totalAmount,
    invoicedPercentage
  };
}