import express from 'express';
import { getMatchedJobs } from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/jobs/match - Semantic job matching against user's resume
router.get('/match', protect, getMatchedJobs);

export default router;
