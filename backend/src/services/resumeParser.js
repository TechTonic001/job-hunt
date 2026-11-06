import { PDFParse } from 'pdf-parse';

const SECTION_PATTERNS = [
  ['summary', /^(professional\s+)?(summary|profile|objective|about\s+me)$/i],
  ['skills', /^(core\s+)?(technical\s+)?skills|^(areas?\s+of\s+expertise)$/i],
  ['experience', /^(professional\s+)?(work\s+)?experience|^(employment|career)\s+(history|experience)$/i],
  ['education', /^(education|academic\s+background|qualifications?)$/i]
];

const normalizeText = (text) => text
  .replace(/\u0000/g, '')
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .split('\n')
  .map((line) => line.trim())
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

export const parseResumeText = (rawText) => {
  const text = normalizeText(rawText);
  if (!text) {
    const error = new Error('No readable text was found in the CV. Scanned PDFs may need OCR before import.');
    error.status = 422;
    throw error;
  }

  const lines = text.split('\n');
  const sections = getSections(lines);
  const { name, title } = extractNameAndTitle(lines);
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = text.match(/(?:\+\d{1,3}[\s().-]*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d[\d\s().-]{6,}\d/)?.[0]?.trim() || '';

  return {
    personalInfo: { name, email, phone, title },
    summary: sections.summary,
    skills: extractSkills(sections.skills),
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education)
  };
};

export const extractResumeText = async (file) => {
  if (file.mimetype === 'text/plain' || /\.txt$/i.test(file.originalname)) {
    return normalizeText(file.buffer.toString('utf8'));
  }

  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText();
    return normalizeText(result.text || '');
  } finally {
    await parser.destroy();
  }
};
