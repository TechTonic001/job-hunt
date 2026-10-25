import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Compares candidate resume against a job description using OpenAI GPT semantic matching
 * @param {Object} resumeData - Structured resume data JSON
 * @param {string} jobDescriptionText - Raw or HTML job description text
 * @returns {Promise<{ matchScore: number, matchingSkills: string[], missingSkills: string[], briefSummary: string }>}
 */
export const evaluateJobMatch = async (resumeData, jobDescriptionText) => {
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
