// types/index.ts

// Types pour les agréments
export interface Agrement {
  id: number;
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
  createdAt?: Date;
  _count?: {
    stages: number;
  };
}

export interface CreateAgrementData {
  departement: string;
  numeroAgrement: string;
  nomDepartement?: string;
}

// Types pour les stages
export interface Stage {
  id: number;
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: Date;
  DateFin: Date;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  NumeroStage: string;
  createdAt?: Date;
  agrementId?: number | null;
  agrement?: Agrement | null;
  reservations?: Reservation[];
  _count?: {
    reservations: number;
  };
}

export interface CreateStageData {
  Titre: string;
  Adresse: string;
  CodePostal: string;
  Ville: string;
  PlaceDisponibles: number;
  DateDebut: string;
  DateFin: string;
  HeureDebut: string;
  HeureFin: string;
  HeureDebut2: string;
  HeureFin2: string;
  Prix: number;
  NumeroStage?: string;
  agrementId?: number;
}

// Types pour les utilisateurs
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: string;
  gender?: string;
  birthDate?: Date;
  birthPlace?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  postalCode?: string;
  city?: string;
  phone1?: string;
  phone2?: string;
  permitNumber?: string;
  permitIssuedAt?: string;
  permitDate?: Date;
  username?: string;
  country?: string;
  createdAt?: Date;
  emailVerified?: Date;
  image?: string;
  acceptTerms?: boolean;
  acceptRules?: boolean;
  confirmPointsCheck?: boolean;
}

// Types pour les réservations
export interface Reservation {
  id: number;
  userId: number;
  stageId: number;
  createdAt: Date;
  TypeStage: string;
  paymentMethod: string;
  paid: boolean;
  user?: User;
  stage?: Stage;
}

export interface ReservationOptions {
  stageType: 1 | 2 | 3 | 4; // Type de stage (1: volontaire, 2: probatoire, 3: tribunal, 4: peine complémentaire)
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types pour les formulaires
export interface FormFieldError {
  field: string;
  message: string;
}

export interface ValidationError {
  errors: FormFieldError[];
  message: string;
}

// Types pour l'authentification
export interface AuthUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  image?: string;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

// Types pour les emails
export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

// Types pour les factures
export interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  customerName: string;
  stripePaymentId?: string;
  pdfData?: Buffer;
  createdAt: Date;
  dueDate: Date;
  userId: number;
  reservationId?: number;
  user?: User;
  reservation?: Reservation;
}

// Énumérations utiles
export enum StageType {
  VOLONTAIRE = 1,
  PROBATOIRE = 2,
  TRIBUNAL = 3,
  PEINE_COMPLEMENTAIRE = 4
}

export enum PaymentMethod {
  CARD = 'card',
  CHECK = 'check',
  CASH = 'cash',
  TRANSFER = 'transfer'
}

export enum InvoiceStatus {
  PAID = 'paid',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin'
}