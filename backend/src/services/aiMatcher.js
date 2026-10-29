import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Evaluates candidate resume against job description using Gemini AI semantic matching
 * @param {Object} resumeData - Structured resume data JSON
 * @param {string} jobDescriptionText - Job description text
 * @returns {Promise<{ matchScore: number, matchingSkills: string[], missingSkills: string[], briefSummary: string }>}
 */
export const evaluateJobMatch = async (resumeData, jobDescriptionText) => {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `You are a strict technical recruiter. Compare the candidate's resume JSON against the job description. Return a strict JSON object with exactly these keys: \`matchScore\` (number 0-100), \`matchingSkills\` (array of strings), \`missingSkills\` (array of strings), and \`briefSummary\` (string, max 2 sentences). Resume: ${JSON.stringify(resumeData)}. Job: ${jobDescriptionText}.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return JSON.parse(response.text());
};

export default evaluateJobMatch;
