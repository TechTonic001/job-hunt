import { createRequire } from 'node:module';
import { PDFParse } from 'pdf-parse';
import { OEM, createWorker } from 'tesseract.js';

const require = createRequire(import.meta.url);
const englishOcrData = require('@tesseract.js-data/eng');
let ocrWorkerPromise;

const getOcrWorker = () => {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker(englishOcrData.code, OEM.LSTM_ONLY, {
      langPath: englishOcrData.langPath,
      gzip: englishOcrData.gzip,
      cacheMethod: 'none'
    }).catch((error) => {
      ocrWorkerPromise = undefined;
      throw error;
    });
  }
  return ocrWorkerPromise;
};

export const shutdownResumeOcrWorker = async () => {
  if (!ocrWorkerPromise) return;
  const worker = await ocrWorkerPromise;
  ocrWorkerPromise = undefined;
  await worker.terminate();
};

const SECTION_PATTERNS = [
  ['summary', /^(?:(?:professional|career|profile)\s+)?(?:summary|profile|objective|about\s+me)$/i],
  ['skills', /^(?:(?:(?:core|technical|key)\s+)?skills(?:\s+and\s+competencies)?|areas?\s+of\s+expertise)$/i],
  ['experience', /^(?:(?:(?:professional|work)\s+)?experience|(?:employment|career)\s+(?:history|experience))$/i],
  ['education', /^(?:education|academic\s+background|educational\s+qualifications?|qualifications?)$/i]
];

const normalizeText = (text) => text
  .replace(/\u0000/g, '')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line) && !/^page\s+\d+(?:\s+of\s+\d+)?$/i.test(line))
  .join('\n')
  .trim();

const sectionForLine = (line) => {
  const heading = line.replace(/[:\s]+$/, '').trim();
  return SECTION_PATTERNS.find(([, pattern]) => pattern.test(heading))?.[0] || null;
};

const getSections = (lines) => {
  const sections = { summary: [], skills: [], experience: [], education: [] };
  let currentSection = null;

  lines.forEach((line) => {
    if (!line) return;
    const section = sectionForLine(line);
    if (section) {
      currentSection = section;
      return;
    }
    if (currentSection) sections[currentSection].push(line);
  });

  return Object.fromEntries(
    Object.entries(sections).map(([name, sectionLines]) => [name, sectionLines.join('\n').trim()])
  );
};

const extractNameAndTitle = (lines) => {
  const topLines = lines.slice(0, 12);
  const firstSectionIndex = topLines.findIndex((line) => sectionForLine(line));
  const headerLines = topLines
    .slice(0, firstSectionIndex < 0 ? topLines.length : firstSectionIndex)
    .filter((line) => (
    line &&
    !/[\w.+-]+@[\w.-]+\.[A-Z]{2,}/i.test(line) &&
    !/https?:\/\/|www\./i.test(line) &&
    !/^\+?[\d\s().-]{7,}$/.test(line)
    ));

  return {
    name: headerLines[0] || '',
    title: headerLines[1] && headerLines[1].length <= 100 ? headerLines[1] : ''
  };
};

const extractSkills = (skillsText) => skillsText
  .split(/\n|[,;|•·]/)
  .map((skill) => skill.replace(/^[-*]\s*/, '').trim())
  .filter((skill) => skill && skill.length <= 80);

const parseExperience = (experienceText) => {
  if (!experienceText) return [];
  const lines = experienceText.split('\n').filter(Boolean);
  if (!lines.length) return [];

  const firstLine = lines[0];
  const role = /^(role|position|job title)\s*:/i.test(firstLine)
    ? firstLine.replace(/^[^:]+:\s*/, '')
    : firstLine;
  const companyIndex = lines.findIndex((line) => /^(company|employer)\s*:/i.test(line));
  const company = companyIndex >= 0 ? lines[companyIndex].replace(/^[^:]+:\s*/, '') : '';
  const remainingLines = lines.filter((_, index) => (
    index !== 0 &&
    index !== companyIndex &&
    !/^(role|position|job title)\s*:/i.test(lines[index])
  ));
  const responsibilities = remainingLines.length
    ? remainingLines.join('\n')
    : '';

  return [{ role, company, responsibilities }];
};

const parseEducation = (educationText) => {
  if (!educationText) return [];
  const lines = educationText.split('\n').filter(Boolean);
  if (!lines.length) return [];

  const entry = { degree: '', institution: '', year: '' };
  const detailLines = [];
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex >= 0) {
      const label = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      if (label === 'degree' || label === 'qualification') entry.degree = value;
      else if (label === 'institution' || label === 'school' || label === 'university') entry.institution = value;
      else if (label === 'year' || label === 'graduation year') entry.year = value;
      else detailLines.push(line);
      return;
    }

    const year = line.match(/\b(?:19|20)\d{2}\b/);
    if (year && !entry.year) {
      entry.year = year[0];
      const withoutYear = line.replace(year[0], '').replace(/[-–,|]/g, ' ').trim();
      if (withoutYear) detailLines.push(withoutYear);
    } else {
      detailLines.push(line);
    }
  });

  if (!entry.degree && detailLines.length) entry.degree = detailLines.shift();
  if (!entry.institution && detailLines.length) entry.institution = detailLines.join(' ');
  return entry.degree || entry.institution || entry.year ? [entry] : [];
};

const extractFallbackText = (text, lines) => {
  const firstSectionIndex = lines.findIndex((line) => sectionForLine(line));
  if (firstSectionIndex >= 0) return '';

  const header = extractNameAndTitle(lines);
  return text
    .replace(header.name, '')
    .replace(header.title, '')
    .trim();
};

export const parseResumeText = (rawText) => {
  const text = normalizeText(rawText);
  if (!text) {
    const error = new Error('No resume text could be recognized. Try a clearer scan or a text-based PDF.');
    error.status = 422;
    throw error;
  }

  const lines = text.split('\n');
  const sections = getSections(lines);
  const { name, title } = extractNameAndTitle(lines);
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = text.match(/(?:\+\d{1,3}[\s().-]*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d[\d\s().-]{6,}\d/)?.[0]?.trim() || '';
  const summary = sections.summary || (
    !sections.skills && !sections.experience && !sections.education
      ? extractFallbackText(text, lines)
      : ''
  );

  return {
    personalInfo: { name, email, phone, title },
    summary,
    skills: extractSkills(sections.skills),
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education)
  };
};

export const extractResumeText = async (file) => {
  if (file.mimetype === 'text/plain' || /\.txt$/i.test(file.originalname)) {
    return normalizeText(file.buffer.toString('utf8'));
  }

  if (!file.buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
    const error = new Error('The selected file is not a valid PDF.');
    error.status = 400;
    throw error;
  }

  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText();
    const text = normalizeText(result.text || '');
    if (text.length >= 100) return text;

    const screenshots = await parser.getScreenshot({
      scale: 2,
      imageDataUrl: false,
      imageBuffer: true
    });
    const worker = await getOcrWorker();
    const recognizedPages = [];
    for (const page of screenshots.pages) {
      const { data } = await worker.recognize(page.data);
      recognizedPages.push(data.text);
    }

    const ocrText = normalizeText(recognizedPages.join('\n'));
    return ocrText || text;
  } finally {
    await parser.destroy();
  }
};
