import express from 'express';
import multer from 'multer';
import { getResume, importResume, saveResume } from '../controllers/resumeController.js';
import { protect as authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const supportedType = file.mimetype === 'application/pdf' || file.mimetype === 'text/plain';
    const supportedExtension = /\.(pdf|txt)$/i.test(file.originalname);
    if (!supportedType || !supportedExtension) {
      const error = new Error('Only PDF and TXT CV files are supported.');
      error.status = 415;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

router.get('/', authMiddleware, getResume);
router.post('/import', authMiddleware, upload.single('file'), importResume);
router.post('/', authMiddleware, saveResume);

export default router;
