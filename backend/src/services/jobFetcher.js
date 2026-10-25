import logger from '../utils/logger.js';

/**
 * Extracts the first valid email address from a string (useful for job description apply emails)
 * @param {string} text - Raw text or HTML to search for an email
 * @returns {string | null} - Extracted email address or null if none found
 */
export const extractEmail = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Look for mailto: link targets first
  const mailtoMatch = text.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (mailtoMatch && mailtoMatch[1]) {
    return mailtoMatch[1].toLowerCase().trim();
  }

  // General email pattern match
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i;
  const match = text.match(emailRegex);
  if (match) {
    const email = match[0].toLowerCase().trim();
    // Filter out common false positives from HTML/XML namespaces or assets
    if (!email.includes('w3.org') && !email.endsWith('.png') && !email.endsWith('.jpg')) {
      return email;
    }
  }

  return null;
};

/**
 * Fetches remote jobs from Remotive API and extracts application emails
 * @param {number} limit - Maximum number of jobs to fetch
 * @returns {Promise<Array<{ id: number|string, title: string, company: string, description: string, sourceUrl: string, applyEmail: string|null }>>}
 */
export const fetchRemoteJobs = async (limit = 10) => {
  try {
    const url = `https://remotive.com/api/remote-jobs?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ATS-Job-Assistant/1.0'
      }
    });

    if (!response.ok) {
      logger.error(`Remotive API responded with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

    return rawJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      description: job.description,
      sourceUrl: job.url,
      applyEmail: extractEmail(job.description)
    }));
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to fetch remote jobs from Remotive API');
    return [];
  }
};

export default fetchRemoteJobs;
