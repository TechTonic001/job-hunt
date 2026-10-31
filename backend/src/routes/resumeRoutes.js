import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
// Removed erroneous Firebase auth import
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';
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
const logger = pino();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// pdf-parse is a CommonJS module — use createRequire to load it in ESM context
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Multer — keep file in memory, never touch disk
const upload = multer({ storage: multer.memoryStorage() });

// Lazy-initialised Gemini client (same pattern as coverLetterGenerator)
let _genAI = null;
const getGenAI = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured in backend/.env');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};



const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-1.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash'
].filter(Boolean);

const router = express.Router();

router
  .route('/')
  .get(protect, getResumes)
  .post(protect, validateResumePayload, createResume);

// PDF preview endpoint — placed before /:id to guarantee explicit route matching
router.get('/:id/preview.pdf', protect, getResumePdfPreview);

// POST /api/resumes/import — AI-powered PDF resume parser
router.post('/import', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded. Send the file under the "resume" field.' });
    }

    // 1. Extract raw text from the PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text?.trim();

    if (!resumeText) {
      return res.status(422).json({ error: 'Could not extract any text from the uploaded PDF.' });
    }

    // 2. Build the Gemini prompt with a strict JSON schema
    const prompt = `You are an expert data extractor. Parse the following resume text into a strict JSON object that perfectly matches this exact schema:
{
  "fullName": "string",
  "personalInfo": {
    "email": "string",
    "phone": "string",
    "location": "string",
    "github": "string",
    "linkedin": "string"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "isCurrent": false,
      "bulletPoints": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "graduationYear": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "techStack": ["string"],
      "liveUrl": "string"
    }
  ],
  "skills": ["string"]
}
If a field is missing in the text, leave it as an empty string or empty array. Do NOT add extra keys. Output ONLY the JSON object with no markdown fences.
Resume text:
${resumeText}`;

    // 3. Try each candidate model until one succeeds
    const client = getGenAI();
    let parsed = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(responseText);
        break;
      } catch (_err) {
        // Rate-limited or model unavailable — try next
        continue;
      }
    }

    if (!parsed) {
      return res.status(503).json({ error: 'AI parsing unavailable right now. All Gemini models are busy. Please try again shortly.' });
    }

    return res.json(parsed);
  } catch (err) {
    logger.error('[/import] Error: ' + err.message);
    return res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

router
  .route('/:id')
  .get(protect, getResumeById)
  .put(protect, validateResumePayload, updateResume)
  .delete(protect, deleteResume);

export default router;


