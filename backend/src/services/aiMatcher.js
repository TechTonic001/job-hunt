import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client using OPENAI_API_KEY with a safe fallback to prevent module loading crashes
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'unconfigured'
});

/**
 * Evaluates candidate resume against job description using OpenAI GPT semantic matching
 * @param {Object} resumeData - Structured resume data JSON
 * @param {string} jobDescriptionText - Job description text
 * @returns {Promise<{ matchScore: number, matchingSkills: string[], missingSkills: string[], briefSummary: string }>}
 */
export const evaluateJobMatch = async (resumeData, jobDescriptionText) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'unconfigured') {
    throw new Error('OPENAI_API_KEY is not configured in the environment variables.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = "You are a strict technical recruiter. Compare the candidate's resume JSON against the job description. Return a strict JSON object with exactly these keys: `matchScore` (number 0-100), `matchingSkills` (array of strings), `missingSkills` (array of strings), and `briefSummary` (string, max 2 sentences on why they fit or don't fit).";

  const userPrompt = `Candidate Resume:\n${JSON.stringify(resumeData, null, 2)}\n\nJob Description:\n${jobDescriptionText}`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from OpenAI matching model');
  }

  return JSON.parse(content);
};

export default evaluateJobMatch;
