import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client using OPENAI_API_KEY with safe fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'unconfigured'
});

/**
 * Generates a concise, high-converting email cover letter tailored to a job description
 * @param {Object} resumeData - Candidate's resume JSON
 * @param {string} jobTitle - Title of the target role
 * @param {string} companyName - Target company name
 * @param {string} jobDescription - Full or excerpted job description
 * @returns {Promise<{ subject: string, body: string }>} - Generated email subject and body
 */
export const generateCoverLetter = async (resumeData, jobTitle, companyName, jobDescription) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'unconfigured') {
    throw new Error('OPENAI_API_KEY is not configured in the environment variables.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = "You are an expert career coach. Write a short, highly professional email cover letter (max 150 words) to a hiring manager. Do NOT use placeholders like [Insert Date]. Use the provided resume details to highlight 2 specific, relevant achievements. Output strict JSON with exactly two keys: `subject` (a catchy, professional email subject line) and `body` (the plain text email body).";

  const userPrompt = `Target Job Title: ${jobTitle}
Target Company: ${companyName}

Job Description:
${jobDescription}

Candidate Resume Data:
${JSON.stringify(resumeData, null, 2)}`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from OpenAI cover letter generator');
  }

  const parsed = JSON.parse(content);
  return {
    subject: parsed.subject || `Application for ${jobTitle} - ${resumeData?.personalInfo?.fullName || 'Candidate'}`,
    body: parsed.body || ''
  };
};

export default generateCoverLetter;
