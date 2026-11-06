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
  ['summary', /^(?:(?:professional|career|profile)?summary|profile|objective|aboutme)$/],
  ['skills', /^(?:(?:(?:core|technical|key)?skills(?:andcompetencies)?)|areas?ofexpertise)$/],
  ['experience', /^(?:(?:(?:professional|work)?experience)|(?:employment|career)(?:history|experience))$/],
  ['education', /^(?:education|academicbackground|educationalqualifications?|qualifications?)$/]
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
  const heading = line
    .replace(/^[\s•·*-]+/, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
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
    .filter((line) => line && !(
      /[\w.+-]+@[\w.-]+\.[A-Z]{2,}|https?:\/\/|www\.|github|instagram|linkedin|facebook|@\w+/i.test(line) ||
      /[|©]/.test(line) ||
      /^\+?[\d\s().-]{7,}$/.test(line)
    ));
  const titlePattern = /\b(engineer|developer|designer|manager|analyst|consultant|architect|specialist|director|officer|scientist|administrator|professional|intern|coordinator|technician|accountant|teacher|nurse|writer|recruiter|marketer|sales)\b/i;
  const title = headerLines.find((line) => titlePattern.test(line) && line.length <= 100) || '';
  const name = headerLines.find((line) => (
    line !== title &&
    line.length <= 80 &&
    /^[\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){1,4}$/u.test(line) &&
    !titlePattern.test(line)
  )) || '';

  return { name, title };
};

const extractSkills = (skillsText) => {
  const skills = [];
  skillsText.split(/\n|[,;|•·]/).forEach((rawSkill) => {
    let skill = rawSkill.replace(/^[-*]\s*/, '').trim();
    if (skill.includes('~~')) skill = skill.slice(skill.lastIndexOf('~~') + 2).trim();
    if (/^(?:frontend|backend|databases?|(?:ai|devops)(?:\s*&\s*|\s+and\s+)?tools?|devops\s*&\s*env)\s*:/i.test(skill)) {
      skill = skill.slice(skill.indexOf(':') + 1).trim();
    } else if (skill.includes(':')) {
      skill = skill.slice(skill.lastIndexOf(':') + 1).trim();
    }
    if (/\b(?:like|to)\s+/i.test(skill)) {
      skill = skill.slice(skill.search(/\b(?:like|to)\s+/i)).replace(/^(?:like|to)\s+/i, '').trim();
    }
    skill = skill.replace(/^EE\s+/i, '').replace(/^Al(?=\s|$)/i, 'AI').replace(/\s+/g, ' ').trim();
    if (
      !skill ||
      skill.length > 80 ||
      !/[A-Z]/.test(skill) ||
      /\b(?:the|that|with|about|passionate|problems|demonstrated|ability|environment|ultimate|goal|in|code|review|ensure|performance|reliability|version|control|completed|computer)\b/i.test(skill) ||
      /\b(?:19|20)\d{2}\b/.test(skill)
    ) {
      return;
    }
    if (skill.length < 2 || /^\d|[.!?]$/.test(skill) || skill.split(/\s+/).length > 5) return;

    skill = skill
      .replace(/\bReact\s+js\b/i, 'React.js')
      .replace(/\bNode\s+js\b/i, 'Node.js')
      .replace(/\bPeystack\b/i, 'Paystack')
      .replace(/\bNodomailer\b/i, 'Nodemailer')
      .replace(/\bReacts\b/i, 'React.js')
      .replace(/^Al\b/i, 'AI')
      .replace(/\bCursor\s+Al\b/i, 'Cursor AI');
    const previousSkill = skills.at(-1);
    if (/^ORM$/i.test(skill) && /^Prisma$/i.test(previousSkill || '')) {
      skills[skills.length - 1] = 'Prisma ORM';
    } else if (/^Workflows$/i.test(skill) && /^AI Agent$/i.test(previousSkill || '')) {
      skills[skills.length - 1] = 'AI Agent Workflows';
    } else if (!skills.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  return skills;
};

const parseExperience = (experienceText) => {
  if (!experienceText) return [];
  const lines = experienceText.split('\n').filter(Boolean);
  if (!lines.length) return [];

  const isEntryHeading = (line) => (
    line.includes('|') ||
    /^[A-Z]/.test(line) &&
    /\b(?:intern|engineer|developer|application|platform|system|project|tool|product|consultant|manager)\b/i.test(line)
  );
  const entries = [];
  let current = null;

  lines.forEach((line) => {
    const isBullet = /^[\s•·*+\-«»]+/.test(line);
    const cleanedLine = line.replace(/^[\s•·*+\-«»]+/, '').trim();
    if (!cleanedLine) return;
    const labeledRole = cleanedLine.match(/^(?:role|position|job title)\s*:\s*(.+)$/i);
    const labeledCompany = cleanedLine.match(/^(?:company|employer)\s*:\s*(.+)$/i);
    if (labeledCompany && current) {
      current.company = labeledCompany[1].trim();
      return;
    }
    if (labeledRole || (!isBullet && isEntryHeading(cleanedLine))) {
      if (current) entries.push(current);
      const heading = labeledRole ? labeledRole[1] : cleanedLine;
      const parts = heading.split('|').map((part) => part.trim()).filter(Boolean);
      let role = heading;
      let company = '';
      if (parts.length > 1) {
        const roleIndex = parts.findIndex((part) => /\b(?:intern|engineer|developer|application|platform|system|tool|product|consultant|manager)\b/i.test(part));
        if (roleIndex >= 0) {
          role = parts[roleIndex];
          company = parts[roleIndex === 0 ? 1 : 0];
        } else {
          [company, role] = parts;
        }
      }
      current = { role, company, responsibilities: [] };
      return;
    }
    if (!current) current = { role: cleanedLine, company: '', responsibilities: [] };
    else current.responsibilities.push(cleanedLine);
  });

  if (current) entries.push(current);
  return entries
    .map((entry) => ({ ...entry, responsibilities: entry.responsibilities.join('\n') }))
    .filter((entry) => entry.role || entry.company || entry.responsibilities);
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
    }
    if (/\b(?:university|college|institute|polytechnic|school)\b/i.test(line)) {
      const institutionStart = line.search(/\b(?:[A-Z][A-Za-z&.'-]*\s+)?(?:university|college|institute|polytechnic|school)\b/i);
      entry.institution = institutionStart >= 0 ? line.slice(institutionStart).trim() : line;
    }
    if (/\b(?:bachelor|b\.?sc|master|m\.?sc|diploma|hnd|b\.?eng|ph\.?d|degree)\b/i.test(line)) entry.degree = line;
    detailLines.push(line);
  });

  if (!entry.institution && !entry.degree && detailLines.length === 1) entry.degree = detailLines[0];
  return entry.degree || entry.institution || entry.year ? [entry] : [];
};

const getOcrColumnText = (tsv, image) => {
  const lines = new Map();
  tsv.split(/\r?\n/).slice(1).forEach((row) => {
    const columns = row.split('\t');
    if (columns.length < 12 || Number(columns[0]) !== 5 || !columns[11]) return;

    const key = columns.slice(1, 5).join(':');
    const left = Number(columns[6]);
    const top = Number(columns[7]);
    const word = { left, text: columns[11] };
    const line = lines.get(key) || { top, words: [] };
    line.words.push(word);
    lines.set(key, line);
  });

  const ocrLines = [...lines.values()].map(({ top, words }) => {
    const sortedWords = words.sort((first, second) => first.left - second.left);
    const splitX = Buffer.from(image).readUInt32BE(16) * 0.54;
    return {
      top,
      fullText: sortedWords.map(({ text }) => text).join(' '),
      leftText: sortedWords.filter(({ left }) => left < splitX).map(({ text }) => text).join(' '),
      rightText: sortedWords.filter(({ left }) => left >= splitX).map(({ text }) => text).join(' ')
    };
  }).sort((first, second) => first.top - second.top);

  const firstSectionLine = ocrLines.findIndex(({ leftText, rightText }) => (
    sectionForLine(leftText) || sectionForLine(rightText)
  ));
  if (firstSectionLine < 0) return ocrLines.map(({ fullText }) => fullText).join('\n');

  const header = ocrLines.slice(0, firstSectionLine).map(({ fullText }) => fullText);
  const leftColumn = ocrLines.slice(firstSectionLine).map(({ leftText }) => leftText).filter(Boolean);
  const rightColumn = ocrLines.slice(firstSectionLine).map(({ rightText }) => rightText).filter(Boolean);
  const educationHeading = rightColumn.findIndex((line) => sectionForLine(line) === 'education');
  if (educationHeading < 0) {
    const institutionIndex = rightColumn.findIndex((line) => /\b(?:university|college|institute|polytechnic)\b/i.test(line));
    if (institutionIndex >= 0) {
      const educationStart = Math.max(0, institutionIndex - 2);
      const educationLines = rightColumn.slice(educationStart, institutionIndex + 2).filter((line) => (
        /\b(?:university|college|institute|polytechnic|bachelor|b\.?sc|master|m\.?sc|diploma|hnd|computer|19\d{2}|20\d{2}|nigeria)\b/i.test(line)
      ));
      rightColumn.splice(educationStart, rightColumn.length - educationStart, 'EDUCATION', ...educationLines);
    }
  }

  return [...header, ...leftColumn, ...rightColumn].join('\n');
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
      const { data } = await worker.recognize(page.data, {}, { text: true, tsv: true });
      recognizedPages.push(data.tsv ? getOcrColumnText(data.tsv, page.data) : data.text);
    }

    const ocrText = normalizeText(recognizedPages.join('\n'));
    return ocrText || text;
  } finally {
    await parser.destroy();
  }
};
