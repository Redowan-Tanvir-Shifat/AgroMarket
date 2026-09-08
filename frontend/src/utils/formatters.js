/**
 * Formats elapsed harvest time from age in days into a friendly human-readable format.
 * Examples:
 * - 14 hours -> "14h" / "১৪ ঘণ্টা"
 * - 399 hours -> "16d 15h" / "১৬ দিন ১৫ ঘণ্টা"
 * - 48 hours -> "2d" / "২ দিন"
 */
export const formatHarvestAge = (ageInDays, lang = 'bn') => {
  const totalHours = Math.max(0, Math.round((parseFloat(ageInDays) || 0) * 24));

  if (totalHours < 24) {
    const hours = Math.max(1, totalHours);
    return lang === 'bn'
      ? `${hours.toLocaleString('bn-BD')} ঘণ্টা`
      : `${hours}h`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (lang === 'bn') {
    if (remainingHours === 0) {
      return `${days.toLocaleString('bn-BD')} দিন`;
    }
    return `${days.toLocaleString('bn-BD')} দিন ${remainingHours.toLocaleString('bn-BD')} ঘণ্টা`;
  }

  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
};
