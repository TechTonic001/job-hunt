import mongoose from 'mongoose';
import JobApplication from '../models/JobApplication.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import { generateCoverLetter } from '../services/coverLetterGenerator.js';
import { enforceAndConsumeQuota } from '../services/quotaService.js';
import { sendApplicationEmail } from '../services/gmailDispatcher.js';
import { buildResumePDF } from '../services/pdfGenerator.js';

/**
 * @desc    Create an application draft and generate tailored AI cover letter
 * @route   POST /api/applications/draft
 * @access  Private
 */
export const createDraft = async (req, res, next) => {
  try {
    const {
      resumeId,
      jobTitle,
      companyName,
      applyEmail,
      jobDescription,
      matchScore
    } = req.body;

    if (!resumeId || !jobTitle || !companyName || !applyEmail) {
      return res.status(400).json({
        error: 'Missing required fields: resumeId, jobTitle, companyName, and applyEmail are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Verify resume ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate AI tailored cover letter
    const { subject, body } = await generateCoverLetter(
      resume,
      jobTitle,
      companyName,
      jobDescription || ''
    );

    const applicationDraft = new JobApplication({
      userId: req.user._id,
      resumeId,
      jobTitle,
      companyName,
      applyEmail,
      matchScore: typeof matchScore === 'number' ? matchScore : 0,
      coverEmailSubject: subject,
      coverEmailBody: body,
      status: 'DRAFTED'
    });

    const savedDraft = await applicationDraft.save();
    return res.status(201).json(savedDraft);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all job applications for the authenticated user
 * @route   GET /api/applications
 * @access  Private
 */
export const getApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ userId: req.user._id }).sort({
      createdAt: -1
    });

    return res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update cover email or recipient email for a draft application
 * @route   PUT /api/applications/:id
 * @access  Private
 */
export const updateDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Job application draft not found' });
    }

    const { coverEmailSubject, coverEmailBody, applyEmail } = req.body;

    const updateFields = {};
    if (coverEmailSubject !== undefined) updateFields.coverEmailSubject = coverEmailSubject;
    if (coverEmailBody !== undefined) updateFields.coverEmailBody = coverEmailBody;
    if (applyEmail !== undefined) updateFields.applyEmail = applyEmail;

    const updatedDraft = await JobApplication.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
        status: 'DRAFTED'
      },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedDraft) {
      return res.status(404).json({
        error: 'Job application draft not found or cannot be edited (only DRAFTED applications can be modified)'
      });
    }

    return res.status(200).json(updatedDraft);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send application draft via Gmail API with generated ATS PDF attached
 * @route   POST /api/applications/:id/send
 * @access  Private
 */
export const sendDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Job application draft not found' });
    }

    // 1. Find draft ensuring DRAFTED status and ownership
    const draft = await JobApplication.findOne({
      _id: id,
      userId: req.user._id,
      status: 'DRAFTED'
    });

    if (!draft) {
      return res.status(404).json({
        error: 'Job application draft not found or is already dispatched'
      });
    }

    // 2. Fetch associated Resume
    const resume = await Resume.findById(draft.resumeId);
    if (!resume) {
      return res.status(404).json({ error: 'Associated resume not found' });
    }

    // 3. Enforce 24h rate limit quota
    let user;
    try {
      user = await enforceAndConsumeQuota(req.user._id);
    } catch (quotaError) {
      if (quotaError.message === 'Daily application limit reached') {
        return res.status(429).json({ error: quotaError.message });
      }
      throw quotaError;
    }

    // 4. Generate the PDF buffer
    const pdfBuffer = await buildResumePDF(resume);

    // 5. Send application email via Gmail Dispatcher
    try {
      await sendApplicationEmail(user, draft, pdfBuffer);
    } catch (emailError) {
      // Record failure on the draft document
      draft.status = 'FAILED';
      draft.errorMessage = emailError.message;
      await draft.save();
      throw emailError;
    }

    // 6. Update draft status to SENT
    draft.status = 'SENT';
    draft.sentAt = new Date();
    await draft.save();

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: 'Application sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createDraft,
  getApplications,
  updateDraft,
  sendDraft
};
