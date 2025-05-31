// types/invoice.ts

export interface ReservationData {
  reservationId: number;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    postalCode: string;
    city: string;
  };
  stage: {
    id: number;
    title: string;
    date: string;
    price: number;
    numeroStage: string;
  };
  reservation: {
    id: number;
    createdAt: string;
    paymentMethod: string;
    typeStage: string;
  };
  invoice: {
    id: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null;
  hasInvoice: boolean;
  needsInvoice: boolean;
}

export interface InvoiceFormData {
  reservationId: number;
  invoiceNumber: string;
  amount: number;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
}

export interface InvoiceListResponse {
  success: boolean;
  reservations: ReservationData[];
  total: number;
}

export interface InvoiceGenerateRequest {
  reservationId: number;
  customData: {
    invoiceNumber: string;
    amount: number;
    customerAddress: string;
    customerPostalCode: string;
    customerCity: string;
  };
}

export interface InvoiceSendRequest {
  reservationId: number;
  customMessage?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface InvoiceStats {
  totalReservations: number;
  invoicesIssued: number;
  needsInvoice: number;
}

// Types pour les méthodes de paiement
export type PaymentMethod = "card" | "check" | "cash" | "transfer";

// Types pour les types de stage
export type StageType = 
  | "recuperation_points"
  | "permis_probatoire" 
  | "alternative_poursuites"
  | "peine_complementaire"
  | "stage";

// Helpers pour les labels
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  card: "Carte bancaire",
  check: "Chèque", 
  cash: "Espèces",
  transfer: "Virement bancaire"
};

export const StageTypeLabels: Record<StageType, string> = {
  recuperation_points: "Récupération des points",
  permis_probatoire: "Permis probatoire (lettre Réf. 48N)",
  alternative_poursuites: "Alternative aux poursuites pénales",
  peine_complementaire: "Peine complémentaire",
  stage: "Stage standard"
};

// Utilitaires
export const formatPaymentMethod = (method: string): string => {
  return PaymentMethodLabels[method as PaymentMethod] || method;
};

export const formatStageType = (type: string): string => {
  return StageTypeLabels[type as StageType] || type;
};