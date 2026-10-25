import mongoose from 'mongoose';
import JobApplication from '../models/JobApplication.js';
import Resume from '../models/Resume.js';
import { generateCoverLetter } from '../services/coverLetterGenerator.js';

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

export default {
  createDraft,
  getApplications,
  updateDraft
};
