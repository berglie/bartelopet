/**
 * Format utilities for dates, numbers, and strings (Norwegian locale)
 */

/**
 * Format date to Norwegian format
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('nb-NO', defaultOptions).format(d);
}

/**
 * Format short date
 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date to relative time (Norwegian)
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'nå nettopp';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min siden`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} timer siden`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dager siden`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} uker siden`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} måneder siden`;
  return `${Math.floor(diffInSeconds / 31536000)} år siden`;
}

/**
 * Format number to Norwegian locale
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('nb-NO', options).format(num);
}

/**
 * Format distance with unit
 */
export function formatDistance(km: number): string {
  return `${formatNumber(km, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`;
}

/**
 * Format duration in minutes to readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} t ${mins} min` : `${hours} t`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
