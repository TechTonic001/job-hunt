import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a concise email cover letter tailored to a role and company using Gemini AI
 * @param {Object} resumeData - Candidate's resume JSON
 * @param {string} jobTitle - Title of the target position
 * @param {string} companyName - Name of the target company
 * @param {string} [jobDescription] - Job description text
 * @returns {Promise<{ subject: string, body: string }>} - Generated email subject and body
 */
export const generateCoverLetter = async (resumeData, jobTitle, companyName, jobDescription) => {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `You are an expert career coach. Write a short, highly professional email cover letter (max 150 words) to a hiring manager for the ${jobTitle} role at ${companyName}. Do NOT use placeholders like [Insert Date]. Use the provided resume details to highlight 2 specific, relevant achievements. Output strict JSON with exactly two keys: \`subject\` (a catchy, professional email subject line) and \`body\` (the plain text email body). Resume: ${JSON.stringify(resumeData)}.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return JSON.parse(response.text());
};

export default generateCoverLetter;
