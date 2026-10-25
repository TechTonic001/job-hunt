import Resume from '../models/Resume.js';
import { fetchRemoteJobs } from '../services/jobFetcher.js';
import { evaluateJobMatch } from '../services/aiMatcher.js';

/**
 * @desc    Fetch remote jobs and perform semantic matching against the user's resume using OpenAI
 * @route   GET /api/jobs/match
 * @access  Private
 */
export const getMatchedJobs = async (req, res, next) => {
  try {
    // 1. Fetch user resume
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(400).json({
        error: 'No resume found for user. Please create a resume first.'
      });
    }

    // 2. Fetch jobs and filter for those with HR/Apply email addresses
    const jobs = await fetchRemoteJobs();
    const emailJobs = jobs.filter((job) => job.applyEmail !== null);

    // 3. Slice to top 5 jobs to optimize LLM tokens and API latency
    const topJobs = emailJobs.slice(0, 5);

    // 4. Concurrently evaluate job matches via OpenAI
    const matchedJobs = await Promise.all(
      topJobs.map(async (job) => {
        const matchResult = await evaluateJobMatch(resume, job.description);
        return {
          ...job,
          ...matchResult,
          match: matchResult
        };
      })
    );

    return res.status(200).json(matchedJobs);
  } catch (error) {
    next(error);
  }
};

export default {
  getMatchedJobs
};
