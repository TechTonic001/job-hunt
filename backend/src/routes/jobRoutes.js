import express from 'express';
import { getMatchedJobs } from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';
import { generateCoverLetter } from '../services/coverLetterGenerator.js';
import { dispatchEmail } from '../services/gmailDispatcher.js';
import { buildResumePDF } from '../services/pdfGenerator.js';
import Resume from '../models/Resume.js';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/jobs/match - Semantic job matching against user's resume
router.get('/match', protect, getMatchedJobs);

// POST /api/jobs/draft - Generate a cover letter draft using Gemini AI
router.post('/draft', protect, async (req, res) => {
  try {
    const { jobTitle, companyName, jobDescription } = req.body;

    if (!jobTitle || !companyName) {
      return res.status(400).json({ error: 'jobTitle and companyName are required.' });
    }

    const userId = req.user._id || req.user.uid;
    const resume = await Resume.findOne({ userId });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found. Please build your resume first.' });
    }

    const draft = await generateCoverLetter(
      resume.toObject(),
      jobTitle,
      companyName,
      jobDescription || `${jobTitle} role`
    );

    return res.json(draft);
  } catch (err) {
    console.error('[/draft] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter draft.' });
  }
});

// POST /api/jobs/dispatch - Send the application email via Gmail API
router.post('/dispatch', protect, async (req, res) => {
  try {
    const { applyEmail, subject, body } = req.body;

    // In this step, send the email without attachment to verify connection works
    await dispatchEmail(applyEmail, subject, body);

    res.json({ success: true, message: 'Email dispatched successfully' });
  } catch (error) {
    console.error('Dispatch Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;

