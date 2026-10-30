import express from 'express';
import { getMatchedJobs } from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';
import { generateCoverLetter } from '../services/coverLetterGenerator.js';
import { sendApplicationEmail } from '../services/gmailDispatcher.js';
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
    const { subject, body, applyEmail, jobTitle, companyName } = req.body;

    if (!subject || !body || !applyEmail) {
      return res.status(400).json({ error: 'subject, body, and applyEmail are required.' });
    }

    const userId = req.user._id || req.user.uid;

    const [resume, user] = await Promise.all([
      Resume.findOne({ userId }),
      User.findById(userId)
    ]);

    if (!resume) {
      return res.status(404).json({ error: 'No resume found. Please build your resume first.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Build a draft object matching sendApplicationEmail's expected shape
    const draftPayload = {
      applyEmail,
      coverEmailSubject: subject,
      coverEmailBody: body
    };

    // Generate the PDF resume to attach to the email
    let pdfBuffer = null;
    try {
      pdfBuffer = await buildResumePDF(resume.toObject());
    } catch (pdfErr) {
      console.warn('[/dispatch] PDF generation failed, sending without attachment:', pdfErr.message);
    }

    await sendApplicationEmail(user, draftPayload, pdfBuffer);

    return res.json({ success: true });
  } catch (err) {
    console.error('[/dispatch] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to dispatch application email.' });
  }
});

export default router;

