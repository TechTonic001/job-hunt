import express from 'express';
import {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { validateResumePayload } from '../validators/resumeValidator.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getResumes)
  .post(protect, validateResumePayload, createResume);

router
  .route('/:id')
  .get(protect, getResumeById)
  .put(protect, validateResumePayload, updateResume)
  .delete(protect, deleteResume);

export default router;
