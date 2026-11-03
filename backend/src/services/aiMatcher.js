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

/**
 * Scores live jobs against resume skills and retains only verified source jobs
 * meeting the requested match threshold.
 */
export const evaluateLiveJobMatches = async (skills, jobs) => {
  if (jobs.length === 0) return [];

  const client = getGenAI();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: { responseMimeType: 'application/json' }
  });
  const prompt = `You are an AI matching engine. Score these ${jobs.length} jobs against the user's CV skills. Return a JSON array strictly containing only the jobs with a matchScore >= 60. Each result must include matchScore, briefSummary (max 10 words), missingSkills, and the original job_apply_link. Preserve the exact job_apply_link from the input. Jobs: ${JSON.stringify(
    jobs
  )}. CV skills: ${JSON.stringify(skills)}.`;
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse((await result.response).text());

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini returned an invalid job match response.');
  }

  const jobsByLink = new Map(jobs.map((job) => [job.job_apply_link, job]));
  const matchedJobs = [];
  const seenLinks = new Set();

  for (const match of parsed) {
    const job = jobsByLink.get(match?.job_apply_link);
    const matchScore = Number(match?.matchScore);
    if (!job || !Number.isFinite(matchScore) || matchScore < 60 || seenLinks.has(job.job_apply_link)) {
      continue;
    }

    const briefSummary = typeof match.briefSummary === 'string'
      ? match.briefSummary.trim().split(/\s+/).slice(0, 10).join(' ')
      : '';
    matchedJobs.push({
      ...job,
      matchScore,
      briefSummary,
      missingSkills: Array.isArray(match.missingSkills) ? match.missingSkills : []
    });
    seenLinks.add(job.job_apply_link);
  }

  return matchedJobs;
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

  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter(Boolean);

  for (const modelName of candidateModels) {
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
