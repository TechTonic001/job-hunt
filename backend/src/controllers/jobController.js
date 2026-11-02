import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import { scrapeAndStoreJobs } from '../services/jobScraper.js';
import { evaluateJobMatches } from '../services/aiMatcher.js';

/**
 * @desc    Fetch remote jobs and perform semantic matching against the user's resume using AI
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

    // 2. Ensure enough jobs in DB, scrape if needed
    const jobCount = await Job.countDocuments();
    if (jobCount < 5) {
      await scrapeAndStoreJobs();
    }

    // 3. Fetch the 10 latest jobs, newest first
    const jobs = await Job.find({}).sort({ createdAt: -1 }).limit(10).lean();

    // Filter jobs that have an apply email address
    const topJobs = jobs.filter(job => job.applyEmail !== null);

    const jobsForMatching = topJobs.map((job) => ({
      ...job,
      description: typeof job.description === 'string'
        ? job.description.slice(0, 800)
        : ''
    }));

    // Evaluate the bounded job list in one Gemini request to avoid serial calls.
    const matchResults = await evaluateJobMatches(resume, jobsForMatching);
    const matchedJobs = topJobs.map((job, index) => ({
      ...job,
      ...matchResults[index],
      match: matchResults[index]
    }));

    return res.status(200).json(matchedJobs);
  } catch (error) {
    next(error);
  }
};

export default {
  getMatchedJobs
};
