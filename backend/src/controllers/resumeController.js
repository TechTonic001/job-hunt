import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import { buildResumePDF } from '../services/pdfGenerator.js';

/**
 * @desc    Create a new resume
 * @route   POST /api/resumes
 * @access  Private
 */
export const createResume = async (req, res, next) => {
  try {
    const resume = new Resume({
      ...req.validatedBody,
      userId: req.user._id
    });

    const savedResume = await resume.save();
    return res.status(201).json(savedResume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resumes for the authenticated user
 * @route   GET /api/resumes
 * @access  Private
 */
export const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.status(200).json(resumes);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific resume by ID
 * @route   GET /api/resumes/:id
 * @access  Private
 */
export const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = await Resume.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json(resume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a resume by ID
 * @route   PUT /api/resumes/:id
 * @access  Private
 */
export const updateResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const updatedResume = await Resume.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id
      },
      {
        ...req.validatedBody
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedResume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json(updatedResume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume by ID
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
export const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const deletedResume = await Resume.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!deletedResume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate and stream ATS-friendly PDF preview of a resume
 * @route   GET /api/resumes/:id/preview.pdf
 * @access  Private
 */
export const getResumePdfPreview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = await Resume.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume_preview.pdf"');

    buildResumePDF(
      resume,
      (chunk) => res.write(chunk),
      () => res.end()
    );
  } catch (error) {
    next(error);
  }
};

