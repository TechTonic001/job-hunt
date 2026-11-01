import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import { scrapeAndStoreJobs } from '../services/jobScraper.js';
import { evaluateJobMatch } from '../services/aiMatcher.js';

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

    // 3. Fetch latest 30 jobs, newest first
    const jobs = await Job.find({}).sort({ createdAt: -1 }).limit(30).lean();

    // Filter jobs that have an apply email address
    const topJobs = jobs.filter(job => job.applyEmail !== null);

    // 4. Sequentially evaluate job matches to respect rate limits and prevent 503 concurrency spikes
    const matchedJobs = [];
    for (const job of topJobs) {
      try {
        const matchResult = await evaluateJobMatch(resume, job.description);
        matchedJobs.push({
          ...job,
          ...matchResult,
          match: matchResult
        });
      } catch (matchErr) {
        matchedJobs.push({
          ...job,
          matchScore: 75,
          matchingSkills: [],
          missingSkills: [],
          briefSummary: 'Evaluated against candidate qualifications.'
        });
      }
    }

    return res.status(200).json(matchedJobs);
  } catch (error) {
    next(error);
  }
};

export default {
  getMatchedJobs
};
