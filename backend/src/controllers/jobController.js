import Resume from '../models/Resume.js';
import axios from 'axios';
import { evaluateLiveJobMatches } from '../services/aiMatcher.js';

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
