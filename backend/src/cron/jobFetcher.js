import cron from 'node-cron';
import logger from '../utils/logger.js';
import { fetchRemoteJobs } from '../services/jobFetcher.js';
import { evaluateJobMatch } from '../services/aiMatcher.js';
import Resume from '../models/Resume.js';
import { User } from '../models/User.js';
import JobApplication from '../models/JobApplication.js';

const MATCH_THRESHOLD = 70;
const JOBS_PER_CYCLE = 20;

/**
 * Core nightly matching cycle:
 * 1. Fetch fresh remote jobs from Remotive
 * 2. For each user with a resume, run Gemini semantic matching
 * 3. Upsert high-match jobs (score >= 70) into JobApplication as 'DRAFTED'
 */
const runJobMatchingCycle = async () => {
  logger.info('[Cron] Starting nightly job matching cycle...');
  const cycleStart = Date.now();

  try {
    // Step 1: Fetch live remote jobs
    const jobs = await fetchRemoteJobs(JOBS_PER_CYCLE);
    if (!jobs.length) {
      logger.warn('[Cron] No jobs returned from Remotive API. Skipping cycle.');
      return;
    }
    logger.info(`[Cron] Fetched ${jobs.length} remote jobs.`);

    // Step 2: Load all users who have a resume
    const resumes = await Resume.find({}).lean();
    if (!resumes.length) {
      logger.info('[Cron] No resumes in DB. Nothing to match.');
      return;
    }
    logger.info(`[Cron] Matching against ${resumes.length} user resume(s).`);

    let totalHighMatches = 0;
    let totalUpserted = 0;

    // Step 3: Score every job against every user's resume
    for (const resume of resumes) {
      const user = await User.findById(resume.userId).lean();
      if (!user) continue;

      for (const job of jobs) {
        let matchResult;
        try {
          matchResult = await evaluateJobMatch(resume, job.description || job.title);
        } catch (err) {
          logger.warn({ err: err.message, jobId: job.id }, '[Cron] evaluateJobMatch failed — skipping job');
          continue;
        }

        if (matchResult.matchScore < MATCH_THRESHOLD) continue;

        totalHighMatches++;

        // Upsert: avoid duplicate applications for the same user+job
        try {
          const existing = await JobApplication.findOne({
            userId: resume.userId,
            jobTitle: job.title,
            companyName: job.company
          });

          if (!existing) {
            await JobApplication.create({
              userId: resume.userId,
              resumeId: resume._id,
              jobTitle: job.title,
              companyName: job.company,
              applyEmail: job.applyEmail || 'noreply@example.com',
              matchScore: matchResult.matchScore,
              status: 'DRAFTED'
            });
            totalUpserted++;
          }
        } catch (dbErr) {
          logger.error({ err: dbErr.message }, '[Cron] Failed to upsert job application');
        }
      }
    }

    const elapsed = ((Date.now() - cycleStart) / 1000).toFixed(1);
    logger.info(
      `[Cron] Cycle complete in ${elapsed}s — ${totalHighMatches} high-match opportunities found, ${totalUpserted} new records inserted.`
    );
  } catch (err) {
    logger.error({ err: err.message }, '[Cron] Job matching cycle crashed unexpectedly');
  }
};

/**
 * Initializes all scheduled cron jobs.
 * Call this once after the DB connection is established.
 */
export const startCronJobs = () => {
  // Run at midnight every day: '0 0 * * *'
  cron.schedule('0 0 * * *', runJobMatchingCycle, {
    timezone: 'UTC'
  });

  logger.info('[Cron] Nightly job matching engine scheduled (UTC midnight).');
};

export default startCronJobs;
