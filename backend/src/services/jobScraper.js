import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import Job from '../models/Job.js';
import logger from '../utils/logger.js';

/**
 * Scrape remote job listings from multiple public APIs, clean HTML descriptions,
 * and upsert them into the `Job` collection.
 *
 * @param {string} [searchField='software'] - Optional search term to filter jobs.
 * @returns {Promise<number>} - Number of newly inserted (upserted) job documents.
 */
export const scrapeAndStoreJobs = async (searchField = 'software') => {
  let insertedCount = 0;
  try {
    // 1️⃣ Fetch from Remotive
    const remotiveRes = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchField)}&limit=50`);
    const remotiveData = remotiveRes.ok ? await remotiveRes.json() : { jobs: [] };
    const remotiveJobs = Array.isArray(remotiveData.jobs) ? remotiveData.jobs : [];

    // 2️⃣ Fetch from ArbeitNow (public job board)
    const arbeitNowRes = await fetch('https://www.arbeitnow.com/api/job-board-api');
    const arbeitNowData = arbeitNowRes.ok ? await arbeitNowRes.json() : { data: [] };
    const arbeitNowJobs = Array.isArray(arbeitNowData.data) ? arbeitNowData.data : [];

    // Helper to clean description HTML
    const cleanHtml = (html) => {
      if (!html) return '';
      const $ = cheerio.load(html);
      return $.text().trim();
    };

    const allJobs = [];

    // Normalise Remotive format
    remotiveJobs.forEach((j) => {
      allJobs.push({
        externalId: `remotive-${j.id}`,
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Remote',
        category: j.category,
        description: cleanHtml(j.description),
        url: j.url,
        source: 'remotive',
        publishedAt: j.publication_date ? new Date(j.publication_date) : new Date()
      });
    });

    // Normalise ArbeitNow format
    arbeitNowJobs.forEach((j) => {
      allJobs.push({
        externalId: `arbeitnow-${j.id}`,
        title: j.title,
        company: j.company,
        location: j.location || 'Remote',
        category: j.tags?.join(', '),
        description: cleanHtml(j.description),
        url: j.url,
        source: 'arbeitnow',
        publishedAt: j.created_at ? new Date(j.created_at) : new Date()
      });
    });

    // Upsert each job – count only when a fresh document is created
    for (const job of allJobs) {
      const result = await Job.findOneAndUpdate(
        { externalId: job.externalId },
        { $setOnInsert: job, $set: job },
        { upsert: true, new: true, rawResult: true }
      );
      // rawResult.lastErrorObject.updatedExisting === false indicates insert
      if (result?.lastErrorObject?.upserted) {
        insertedCount++;
      }
    }

    logger.info(`[scrapeAndStoreJobs] Completed – ${insertedCount} new jobs upserted out of ${allJobs.length} fetched.`);
    return insertedCount;
  } catch (err) {
    logger.error({ err: err.message }, '[scrapeAndStoreJobs] Failed');
    throw err;
  }
};
