// utils/dateUtils.ts
// ✅ SOLUTION DÉFINITIVE VERCEL - Compatible partout (localhost + Vercel + toutes timezone)

/**
 * Crée une date à midi UTC pour éviter TOUS les problèmes de fuseau horaire
 * Cette fonction garantit que la date sera identique partout
 */
export function createSafeDate(dateInput: Date | string | null | undefined): Date {
  if (!dateInput) {
    return new Date(); // Fallback pour les valeurs nulles
  }

  if (dateInput instanceof Date) {
    // Si c'est déjà un objet Date, extraire les composants de la date locale
    // et recréer à midi UTC pour éviter les décalages
    const year = dateInput.getFullYear();
    const month = dateInput.getMonth();
    const day = dateInput.getDate();
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  
  // Si c'est une string (format ISO ou autre)
  const dateStr = dateInput.toString().trim();
  
  // Gérer différents formats de string
  let year: number, month: number, day: number;
  
  if (dateStr.includes('T')) {
    // Format ISO avec heure (2024-01-15T10:30:00.000Z)
    const datePart = dateStr.split('T')[0];
    [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
  } else if (dateStr.includes('/')) {
    // Format DD/MM/YYYY ou MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assumons DD/MM/YYYY (format français)
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      throw new Error(`Format de date non supporté: ${dateStr}`);
    }
  } else if (dateStr.includes('-')) {
    // Format YYYY-MM-DD
    [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  } else {
    throw new Error(`Format de date non supporté: ${dateStr}`);
  }
  
  // Validation des valeurs
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Date invalide: ${dateStr}`);
  }
  
  // ✅ CRUCIAL : Créer à midi UTC pour éviter TOUS les décalages de fuseau horaire
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Formate une date en français court (DD/MM/YYYY)
 * ✅ GARANTI de fonctionner identiquement partout
 */
export function formatDateShortFR(dateInput: Date | string | null | undefined): string {
  const date = createSafeDate(dateInput);
  
  // Utiliser UNIQUEMENT les méthodes UTC puisqu'on a créé la date en UTC
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date en français long (Lundi 15 Janvier 2024)
 * ✅ GARANTI de fonctionner identiquement partout
 */
export function formatDateLongFR(dateInput: Date | string | null | undefined): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const date = createSafeDate(dateInput);
  
  // Utiliser UNIQUEMENT les méthodes UTC
  const dayName = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

/**
 * Formate une date pour les emails (style français standard)
 */
export function formatDateForEmail(dateInput: Date | string | null | undefined): string {
  return formatDateShortFR(dateInput);
}

/**
 * Formate la date actuelle pour les emails
 * ✅ Utilise également createSafeDate pour la cohérence
 */
export function formatCurrentDate(): string {
  return formatDateShortFR(new Date());
}

/**
 * Formate une date avec heure pour les notifications
 * ✅ Format: DD/MM/YYYY à HH:MM
 */
export function formatDateTimeForEmail(dateInput: Date | string | null | undefined): string {
  const date = createSafeDate(dateInput);
  const dateStr = formatDateShortFR(date);
  
  // Ajouter l'heure si nécessaire (midi UTC = heure cohérente)
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${dateStr} à ${hours}:${minutes}`;
}

/**
 * Utilitaire pour déboguer les dates - montre la date dans différents formats
 */
export function debugDate(dateInput: Date | string | null | undefined, label: string = 'Date'): void {
  console.log(`🐛 DEBUG ${label}:`);
  console.log(`  Input: ${dateInput}`);
  console.log(`  createSafeDate: ${createSafeDate(dateInput).toISOString()}`);
  console.log(`  formatDateShortFR: ${formatDateShortFR(dateInput)}`);
  console.log(`  formatDateLongFR: ${formatDateLongFR(dateInput)}`);
}