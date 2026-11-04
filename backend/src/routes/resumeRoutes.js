import express from 'express';
import { getResume, saveResume } from '../controllers/resumeController.js';
import { protect as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getResume);
router.post('/', authMiddleware, saveResume);

export default router;
