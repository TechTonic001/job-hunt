import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names and resolves conflicting Tailwind classes
 * @param  {...any} inputs - Class values to merge
 * @returns {string} - Merged Tailwind class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
