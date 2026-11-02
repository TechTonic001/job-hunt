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

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return res.status(503).json({
        error: 'Global job search is not configured. Set RAPIDAPI_KEY on the backend.'
      });
    }

    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    const jobTitle =
      experience.find((item) => item.isCurrent && item.role)?.role ||
      experience.find((item) => item.role)?.role ||
      (resume.title && resume.title !== 'My Resume' ? resume.title : '') ||
      skills.slice(0, 3).join(' ') ||
      'software developer';

    let response;
    try {
      response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        timeout: 15000,
        params: {
          query: `${jobTitle} remote`,
          page: '1',
          num_pages: '1'
        },
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com'
        }
      });
    } catch (error) {
      error.status = 502;
      error.message = 'Global job search provider request failed.';
      return next(error);
    }

    const jobs = (Array.isArray(response.data?.data) ? response.data.data : [])
      .slice(0, 15)
      .map((job) => ({
        job_title: job.job_title || '',
        employer_name: job.employer_name || '',
        job_description: typeof job.job_description === 'string'
          ? job.job_description.slice(0, 800)
          : '',
        job_apply_link: job.job_apply_link || ''
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
