import { addDays } from 'date-fns';

/**
 * Standardized date-time formatter for Order-Do (Indian Format)
 * Output: "08 April 2026, 10:15 PM"
 */
export const formatIndianDateTime = (dateString: string | number | Date | null, locale: string = 'en-IN'): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  const finalLocale = locale === 'hi' ? 'hi-IN' : (locale === 'en' ? 'en-IN' : locale);

  return date.toLocaleString(finalLocale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Adds exactly 30 days to a date while preserving the time
 */
export const add30Days = (date: Date | string | number): string => {
  return addDurationDays(date, 30);
};

/**
 * Adds exactly 365 days to a date while preserving the time
 */
export const add365Days = (date: Date | string | number): string => {
  return addDurationDays(date, 365);
};

/**
 * Adds a specific number of days to a date while preserving the time
 */
export const addDurationDays = (date: Date | string | number, days: number): string => {
  const baseDate = new Date(date);
  const newDate = addDays(baseDate, days);
  return newDate.toISOString();
};

/**
 * Checks if a subscription is expired
 */
export const isExpired = (expiryDate: string | null, referenceDate?: Date): boolean => {
  if (!expiryDate) return true;
  const now = referenceDate || new Date();
  return new Date(expiryDate) < now;
};

/**
 * Checks if a subscription is expiring soon (within 3 days = 72 hours)
 */
export const isExpiringSoon = (expiryDate: string | null, referenceDate?: Date): boolean => {
  if (!expiryDate) return false;
  const now = referenceDate || new Date();
  const exp = new Date(expiryDate);
  const diffInMs = exp.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  // Return true if expiring within next 3 days AND not yet expired
  return diffInDays > 0 && diffInDays <= 3;
};

/**
 * Calculates remaining days and returns a formatted string
 */
export const getFormattedRemainingTime = (expiryDate: string | null, locale: string = 'en'): string => {
  if (!expiryDate) return locale === 'hi' ? 'कोई सक्रिय प्लान नहीं' : 'No active plan';
  
  const diff = new Date(expiryDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days <= 0) return locale === 'hi' ? 'समाप्त' : 'Expired';
  if (days === 1) return locale === 'hi' ? 'कल समाप्त हो रहा है' : 'Expires tomorrow';
  
  return locale === 'hi' 
    ? `शेष: ${days} दिन` 
    : `Remaining: ${days} days`;
};

/**
 * Calculates remaining days as a number
 */
export const getRemainingDays = (expiryDate: string | null): number => {
  if (!expiryDate) return 0;
  const diff = new Date(expiryDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};
