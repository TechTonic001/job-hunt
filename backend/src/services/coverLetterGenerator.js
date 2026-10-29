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
 * Generates a concise email cover letter tailored to a role and company using Gemini AI
 * with model fallback and graceful template backup
 * @param {Object} resumeData - Candidate's resume JSON
 * @param {string} jobTitle - Title of the target position
 * @param {string} companyName - Name of the target company
 * @param {string} [jobDescription] - Job description text
 * @returns {Promise<{ subject: string, body: string }>} - Generated email subject and body
 */
export const generateCoverLetter = async (resumeData, jobTitle, companyName, jobDescription) => {
  const client = getGenAI();
  const prompt = `You are an expert career coach. Write a short, highly professional email cover letter (max 150 words) to a hiring manager for the ${jobTitle} role at ${companyName}. Do NOT use placeholders like [Insert Date]. Use the provided resume details to highlight 2 specific, relevant achievements. Output strict JSON with exactly two keys: \`subject\` (a catchy, professional email subject line) and \`body\` (the plain text email body). Resume: ${JSON.stringify(
    resumeData
  )}.`;

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

      if (parsed.subject && parsed.body) {
        return parsed;
      }
    } catch (_err) {
      // High demand (503) or rate limit (429) -> fallback to next candidate model
      continue;
    }
  }

  // Graceful fallback cover letter template
  const name =
    resumeData?.fullName ||
    resumeData?.personalInfo?.fullName ||
    'Applicant';

  return {
    subject: `Application for ${jobTitle} - ${name}`,
    body: `Dear Hiring Team at ${companyName},\n\nI am writing to express my strong interest in the ${jobTitle} position. With my technical skills and project experience, I am confident in my ability to contribute effectively from day one.\n\nPlease find my resume attached for your consideration. I look forward to discussing how my experience aligns with your team's objectives.\n\nBest regards,\n${name}`
  };
};

export default generateCoverLetter;
