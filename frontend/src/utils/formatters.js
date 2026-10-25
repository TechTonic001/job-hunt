/**
 * Formats a date into a localized readable string
 * @param {Date | string | number} date
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export function formatDate(date, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Formats a score as an ATS match percentage
 * @param {number} score - Score between 0 and 100 or 0 and 1
 * @returns {string}
 */
export function formatMatchScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return '0%';
  const normalized = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${Math.min(100, Math.max(0, normalized))}%`;
}

/**
 * Truncates text to a specified maximum length with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
}
