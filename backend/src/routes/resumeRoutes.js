import express from 'express';
import {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  getResumePdfPreview
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { validateResumePayload } from '../validators/resumeValidator.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getResumes)
  .post(protect, validateResumePayload, createResume);

// PDF preview endpoint - placed before /:id block to guarantee explicit route matching
router.get('/:id/preview.pdf', protect, getResumePdfPreview);

router
  .route('/:id')
  .get(protect, getResumeById)
  .put(protect, validateResumePayload, updateResume)
  .delete(protect, deleteResume);

export default router;

