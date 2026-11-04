import Resume from '../models/Resume.js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { evaluateLiveJobMatches } from '../services/aiMatcher.js';

export const generateCoverLetter = async (req, res, next) => {
  try {
    const { job_title: jobTitle, employer_name: employerName, job_description: jobDescription } = req.body;

    if (!jobTitle || !employerName) {
      return res.status(400).json({ error: 'job_title and employer_name are required.' });
    }

    const resume = await Resume.findOne({ userId: req.user._id || req.user.uid });
    if (!resume) {
      return res.status(404).json({
        error: 'No resume found for user. Please create a resume first.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in backend/.env');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert technical recruiter and career coach. I am providing a candidate's CV data and a specific job description for ${jobTitle} at ${employerName}. Write a highly tailored, compelling 3-paragraph cover letter demonstrating why this candidate's specific engineering skills perfectly align with the job requirements. Do not use generic [Insert Name Here] placeholders; use the real data. Output only the plain cover letter text, no markdown formatting.

Candidate CV data:
${JSON.stringify(resume.toObject())}

Job description:
${jobDescription || `${jobTitle} at ${employerName}`}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return res.status(200).json({ coverLetter: response.text() });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch remote jobs and perform semantic matching against the user's resume using AI
 * @route   GET /api/jobs/match
 * @access  Private
 */
export const getMatchedJobs = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id || req.user.uid });
    if (!resume) {
      return res.status(400).json({
        error: 'No resume found for user. Please create a resume first.'
      });
    }

    const skills = Array.isArray(resume.skills) ? resume.skills : [];

    let response;
    try {
      response = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
        timeout: 15000
      });
    } catch (error) {
      error.status = 502;
      error.message = 'Job search provider request failed.';
      return next(error);
    }

    const topJobs = Array.isArray(response.data?.data) ? response.data.data.slice(0, 15) : [];
    const jobs = topJobs
      .map((job) => ({
        job_title: job.title || '',
        employer_name: job.company_name || job.company || '',
        job_description: typeof job.description === 'string'
          ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 800)
          : '',
        job_apply_link: job.url || ''
      }))
      .filter((job) => job.job_apply_link);

    const matchedJobs = await evaluateLiveJobMatches(skills, jobs);
    return res.status(200).json(matchedJobs);
  } catch (error) {
    next(error);
  }
};

export default {
  getMatchedJobs
};
