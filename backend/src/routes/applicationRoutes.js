import express from 'express';
import {
  createDraft,
  getApplications,
  updateDraft,
  sendDraft
} from '../controllers/applicationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/applications - List all applications for authenticated user
router.get('/', protect, getApplications);

// POST /api/applications/draft - Create draft with AI generated cover letter
router.post('/draft', protect, createDraft);

// PUT /api/applications/:id - Update draft details
router.put('/:id', protect, updateDraft);

// POST /api/applications/:id/send - Dispatch application via Gmail API
router.post('/:id/send', protect, sendDraft);

export default router;
