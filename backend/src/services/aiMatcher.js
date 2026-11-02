import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured in backend/.env');
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

/**
 * Heuristic fallback matching in case LLM endpoints are unavailable or experiencing high demand (503/429)
 */
const generateHeuristicMatch = (resumeData, jobDescriptionText) => {
  const resumeSkills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
  const text = (jobDescriptionText || '').toLowerCase();
  const matching = [];
  const missing = [];

  for (const skill of resumeSkills) {
    const s = typeof skill === 'string' ? skill : skill.name || '';
    if (!s) continue;
    if (text.includes(s.toLowerCase())) {
      matching.push(s);
    } else {
      missing.push(s);
    }
  }

  const score =
    resumeSkills.length > 0
      ? Math.round((matching.length / resumeSkills.length) * 100)
      : 75;

  return {
    matchScore: Math.max(60, Math.min(score, 95)),
    matchingSkills: matching.slice(0, 5),
    missingSkills: missing.slice(0, 3),
    briefSummary: 'Matched based on your verified resume skills and the position description.'
  };
};

const normalizeMatchResult = (result) => {
  const summary = typeof result?.briefSummary === 'string'
    ? result.briefSummary.trim().split(/\s+/).slice(0, 14).join(' ')
    : '';

  return {
    matchScore: typeof result?.matchScore === 'number' ? result.matchScore : 75,
    matchingSkills: Array.isArray(result?.matchingSkills) ? result.matchingSkills : [],
    missingSkills: Array.isArray(result?.missingSkills) ? result.missingSkills : [],
    briefSummary: summary
  };
};

const getCandidateModels = () => [
  process.env.GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash'
].filter(Boolean);

/**
 * Evaluates a bounded list of jobs against a resume in one Gemini request.
 * @param {Object} resumeData - Structured resume data JSON
 * @param {Array<Object>} jobs - Jobs with descriptions limited by the caller
 * @returns {Promise<Array<{ matchScore: number, matchingSkills: string[], missingSkills: string[], briefSummary: string }>>}
 */
export const evaluateJobMatches = async (resumeData, jobs) => {
  if (jobs.length === 0) return [];

  const fallbackResults = jobs.map((job) =>
    generateHeuristicMatch(resumeData, job.description)
  );

  try {
    const client = getGenAI();
    const jobDescriptions = jobs.map((job, index) => ({
      index,
      title: job.title,
      company: job.company,
      description: job.description
    }));
    const prompt = `You are a ruthless technical recruiter. I am providing a user CV and a JSON array of ${jobs.length} job descriptions. Return a JSON array matching the exact length (${jobs.length}) scoring each job against the CV. Each item must have exactly these keys: \`matchScore\` (number 0-100), \`matchingSkills\` (array of strings), \`missingSkills\` (array of strings), and \`briefSummary\` (string under 15 words). Keep the results in the same order as the input. Process this as fast as possible. CV: ${JSON.stringify(
      resumeData
    )}. Jobs: ${JSON.stringify(jobDescriptions)}.`;

    for (const modelName of getCandidateModels()) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const parsed = JSON.parse(response.text());

        if (!Array.isArray(parsed) || parsed.length !== jobs.length) {
          throw new Error('Gemini returned an unexpected number of job matches.');
        }

        return parsed.map(normalizeMatchResult);
      } catch (_err) {
        // Try the next model, then fall back to heuristic matches.
        continue;
      }
    }
  } catch (_err) {
    // Fall back to heuristic matches if Gemini is unavailable.
  }

  return fallbackResults;
};

/**
 * Evaluates candidate resume against job description using Gemini AI semantic matching
 * with automatic model fallback and graceful heuristic backup
 * @param {Object} resumeData - Structured resume data JSON
 * @param {string} jobDescriptionText - Job description text
 * @returns {Promise<{ matchScore: number, matchingSkills: string[], missingSkills: string[], briefSummary: string }>}
 */
export const evaluateJobMatch = async (resumeData, jobDescriptionText) => {
  const client = getGenAI();
  const prompt = `You are a strict technical recruiter. Compare the candidate's resume JSON against the job description. Return a strict JSON object with exactly these keys: \`matchScore\` (number 0-100), \`matchingSkills\` (array of strings), \`missingSkills\` (array of strings), and \`briefSummary\` (string, max 2 sentences). Resume: ${JSON.stringify(
    resumeData
  )}. Job: ${jobDescriptionText}.`;

  for (const modelName of getCandidateModels()) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const parsed = JSON.parse(response.text());

      return {
        matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 75,
        matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
        briefSummary: typeof parsed.briefSummary === 'string' ? parsed.briefSummary : ''
      };
    } catch (_err) {
      // High demand (503) or rate limit (429) -> fallback to next candidate model
      continue;
    }
  }

  // Graceful fallback if all models are busy
  return generateHeuristicMatch(resumeData, jobDescriptionText);
};

export default evaluateJobMatch;
