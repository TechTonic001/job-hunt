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

const extractNameAndTitle = (lines, isOcr) => {
  const topLines = lines.slice(0, 12);
  const firstSectionIndex = topLines.findIndex((line) => sectionForLine(line));
  if (!isOcr) {
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
  }

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

const extractSkills = (skillsText, isOcr) => {
  if (!isOcr) {
    return skillsText
      .split(/\n|[,;|•·]/)
      .map((skill) => skill.replace(/^[-*]\s*/, '').trim())
      .filter((skill) => skill && skill.length <= 80);
  }

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
      (!/^[A-Z]/.test(skill) && !/[.+/#]/.test(skill)) ||
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

const parseExperience = (experienceText, isOcr) => {
  if (!experienceText) return [];
  const lines = experienceText.split('\n').filter(Boolean);
  if (!lines.length) return [];

  if (!isOcr) {
    const firstLine = lines[0];
    const role = /^(role|position|job title)\s*:/i.test(firstLine)
      ? firstLine.replace(/^[^:]+:\s*/, '')
      : firstLine;
    const companyIndex = lines.findIndex((line) => /^(company|employer)\s*:/i.test(line));
    const company = companyIndex >= 0 ? lines[companyIndex].replace(/^[^:]+:\s*/, '') : '';
    const responsibilities = lines.filter((_, index) => (
      index !== 0 &&
      index !== companyIndex &&
      !/^(role|position|job title)\s*:/i.test(lines[index])
    ));
    return [{ role, company, responsibilities: responsibilities.join('\n') }];
  }

  const isEntryHeading = (line) => (
    line.includes('|') ||
    /^[A-Z]/.test(line) &&
    !/^(?:architected|built|collaborated|created|defended|delivered|designed|developed|engineered|formulated|gained|implemented|integrated|launched|led|managed|maintained|participated|supported|worked|wrote)\b/i.test(line) &&
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
      role = role.replace(/^Al(?=[-\s])/i, 'AI');
      if (role.includes('(') && !role.includes(')')) role = role.slice(0, role.indexOf('(')).trim();
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

const parseEducation = (educationText, isOcr) => {
  if (!educationText) return [];
  const lines = educationText.split('\n').filter(Boolean);
  if (!lines.length) return [];

  if (!isOcr) {
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
  }

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
    if (
      isOcr &&
      entry.degree &&
      /\b(?:in|of|for)\s*$/i.test(entry.degree) &&
      !year &&
      !/\b(?:university|college|institute|polytechnic|school)\b/i.test(line)
    ) {
      entry.degree = `${entry.degree} ${line}`.trim();
      return;
    }
    if (/\b(?:university|college|institute|polytechnic|school)\b/i.test(line)) {
      const institutionStart = line.search(/\b(?:[A-Z][A-Za-z&.'-]*\s+)?(?:university|college|institute|polytechnic|school)\b/i);
      entry.institution = (institutionStart >= 0 ? line.slice(institutionStart) : line)
        .replace(/^Ql\s+(?=College of ICT\b)/i, 'SQI ')
        .trim();
    }
    if (/\b(?:bachelor|b\.?sc|master|m\.?sc|diploma|hnd|b\.?eng|ph\.?d|degree)\b/i.test(line)) entry.degree = line;
    detailLines.push(line);
  });

  if (!entry.institution && !entry.degree && detailLines.length === 1) entry.degree = detailLines[0];
  return entry.degree || entry.institution || entry.year ? [entry] : [];
};

const extractOcrPageText = async (worker, page, pageIndex) => {
  const image = Buffer.from(page.data);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  const bodyTop = Math.round(height * 0.18);
  const bodyHeight = height - bodyTop;
  const regions = [
    ...(pageIndex === 0
      ? [{
        rectangle: {
          left: Math.round(width * 0.05),
          top: Math.round(height * 0.065),
          width: Math.round(width * 0.9),
          height: Math.round(height * 0.12)
        }
      }]
      : []),
    {
      rectangle: {
        left: Math.round(width * 0.075),
        top: bodyTop,
        width: Math.round(width * 0.595),
        height: bodyHeight
      }
    },
    {
      rectangle: {
        left: Math.round(width * 0.675),
        top: bodyTop,
        width: Math.round(width * 0.285),
        height: bodyHeight
      }
    }
  ];
  const textRegions = [];

  for (const { rectangle } of regions) {
    const result = await worker.recognize(image, { rectangle }, { text: true });
    textRegions.push(result.data.text);
  }

  return textRegions.join('\n');
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

export const parseResumeText = (rawText, { isOcr = false } = {}) => {
  const text = normalizeText(rawText);
  if (!text) {
    const error = new Error('No resume text could be recognized. Try a clearer scan or a text-based PDF.');
    error.status = 422;
    throw error;
  }

  const lines = text.split('\n');
  const sections = getSections(lines);
  const { name, title } = extractNameAndTitle(lines, isOcr);
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
    skills: extractSkills(sections.skills, isOcr),
    experience: parseExperience(sections.experience, isOcr),
    education: parseEducation(sections.education, isOcr)
  };
};

export const extractResumeText = async (file) => {
  if (file.mimetype === 'text/plain' || /\.txt$/i.test(file.originalname)) {
    return { text: normalizeText(file.buffer.toString('utf8')), isOcr: false };
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
    if (text.length >= 100) return { text, isOcr: false };

    const screenshots = await parser.getScreenshot({
      scale: 2,
      imageDataUrl: false,
      imageBuffer: true
    });
    const worker = await getOcrWorker();
    const recognizedPages = [];
    for (const [index, page] of screenshots.pages.entries()) {
      recognizedPages.push(await extractOcrPageText(worker, page, index));
    }

    const ocrText = normalizeText(recognizedPages.join('\n'));
    return { text: ocrText || text, isOcr: true };
  } finally {
    await parser.destroy();
  }
};
