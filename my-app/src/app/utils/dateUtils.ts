// utils/dateUtils.ts
// ✅ SOLUTION DÉFINITIVE VERCEL - Fonctionne partout (localhost + Vercel)

/**
 * Crée une date à midi UTC pour éviter les problèmes de fuseau horaire
 * Compatible Vercel + localhost
 */
export function createSafeDate(dateInput: Date | string): Date {
  if (dateInput instanceof Date) {
    // Si c'est déjà un objet Date, extraire les composants et recréer à midi UTC
    const dateStr = dateInput.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }
  
  // Si c'est une string
  const dateStr = dateInput.toString();
  
  // Extraire seulement la partie date (YYYY-MM-DD)
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
  
  // ✅ CRUCIAL : Créer à midi UTC pour éviter les décalages de fuseau horaire
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Formate une date en français court (DD/MM/YYYY)
 * Compatible Vercel + localhost
 */
export function formatDateShortFR(dateInput: Date | string): string {
  const date = createSafeDate(dateInput);
  
  // Utiliser les méthodes UTC car on a créé la date en UTC
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date en français long (Lundi 15 Janvier 2024)
 * Compatible Vercel + localhost
 */
export function formatDateLongFR(dateInput: Date | string): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  const date = createSafeDate(dateInput);
  
  // Utiliser les méthodes UTC car on a créé la date en UTC
  const dayName = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

/**
 * Formate une date pour les emails (style français standard)
 * Compatible Vercel + localhost
 */
export function formatDateForEmail(dateInput: Date | string): string {
  return formatDateShortFR(dateInput);
}

/**
 * Formate la date actuelle pour les emails
 * Compatible Vercel + localhost
 */
export function formatCurrentDate(): string {
  return formatDateShortFR(new Date());
}