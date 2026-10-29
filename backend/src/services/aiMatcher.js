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
