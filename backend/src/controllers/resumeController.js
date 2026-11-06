import Resume from '../models/Resume.js';
import { extractResumeText, parseResumeText } from '../services/resumeParser.js';

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.uid;

const normalizeExperience = (experience) => {
  if (Array.isArray(experience)) {
    return experience
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        role: typeof item.role === 'string' ? item.role : '',
        company: typeof item.company === 'string' ? item.company : '',
        responsibilities: typeof item.responsibilities === 'string'
          ? item.responsibilities
          : Array.isArray(item.bulletPoints)
            ? item.bulletPoints.filter((line) => typeof line === 'string').join('\n')
            : ''
      }));
  }

  if (typeof experience === 'string' && experience.trim()) {
    return [{ role: '', company: '', responsibilities: experience }];
  }
  return [];
};

const normalizeEducation = (education) => {
  if (Array.isArray(education)) {
    return education
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        degree: typeof item.degree === 'string' ? item.degree : '',
        institution: typeof item.institution === 'string' ? item.institution : '',
        year: typeof item.year === 'string'
          ? item.year
          : typeof item.graduationYear === 'string'
            ? item.graduationYear
            : ''
      }));
  }

  if (typeof education !== 'string' || !education.trim()) return [];
  return education.split(/\n\s*\n/).map((section) => {
    const entry = { degree: '', institution: '', year: '' };
    section.split('\n').forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex < 0) return;
      const label = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      if (label === 'degree') entry.degree = value;
      if (label === 'institution') entry.institution = value;
      if (label === 'graduation year' || label === 'year') entry.year = value;
    });
    if (!entry.degree && !entry.institution && !entry.year) entry.degree = section.trim();
    return entry;
  }).filter((entry) => entry.degree || entry.institution || entry.year);
};

const toResumeResponse = (resume) => {
  if (!resume) return {};

  const personalInfo = resume.personalInfo || {};
  return {
    _id: resume._id,
    personalInfo: {
      name: personalInfo.name || personalInfo.fullName || resume.name || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      title: personalInfo.title || ''
    },
    summary: resume.summary || personalInfo.summary || '',
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    experience: normalizeExperience(resume.experience),
    education: normalizeEducation(resume.education)
  };
};

export const getResume = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const resume = await Resume.findOne({ userId }).lean();
    return res.status(200).json(toResumeResponse(resume));
  } catch (error) {
    return next(error);
  }
};

export const importResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Select a PDF or TXT CV to import.' });
    }

    const text = await extractResumeText(req.file);
    const importedResume = parseResumeText(text);
    return res.status(200).json(importedResume);
  } catch (error) {
    return next(error);
  }
};

export const saveResume = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'CV data must be an object.' });
    }

    const { personalInfo = {}, summary = '', skills = [], experience = [], education = [] } = req.body;
    if (!personalInfo || typeof personalInfo !== 'object' || Array.isArray(personalInfo)) {
      return res.status(400).json({ error: 'personalInfo must be an object.' });
    }
    if (!Array.isArray(skills) || !skills.every((skill) => typeof skill === 'string')) {
      return res.status(400).json({ error: 'skills must be an array of strings.' });
    }
    if (typeof summary !== 'string') {
      return res.status(400).json({ error: 'summary must be a string.' });
    }
    if (!Array.isArray(experience) || !experience.every((item) => (
      item && typeof item === 'object' && !Array.isArray(item) &&
      ['role', 'company', 'responsibilities'].every((field) => item[field] === undefined || typeof item[field] === 'string')
    ))) {
      return res.status(400).json({ error: 'experience must be an array of role, company, and responsibilities objects.' });
    }
    if (!Array.isArray(education) || !education.every((item) => (
      item && typeof item === 'object' && !Array.isArray(item) &&
      ['degree', 'institution', 'year'].every((field) => item[field] === undefined || typeof item[field] === 'string')
    ))) {
      return res.status(400).json({ error: 'education must be an array of degree, institution, and year objects.' });
    }

    const update = {
      personalInfo: {
        name: typeof personalInfo.name === 'string' ? personalInfo.name.trim() : '',
        email: typeof personalInfo.email === 'string' ? personalInfo.email.trim() : '',
        phone: typeof personalInfo.phone === 'string' ? personalInfo.phone.trim() : '',
        title: typeof personalInfo.title === 'string' ? personalInfo.title.trim() : ''
      },
      summary: summary.trim(),
      skills: skills.map((skill) => skill.trim()).filter(Boolean),
      experience: experience.map((item) => ({
        role: typeof item.role === 'string' ? item.role.trim() : '',
        company: typeof item.company === 'string' ? item.company.trim() : '',
        responsibilities: typeof item.responsibilities === 'string' ? item.responsibilities.trim() : ''
      })).filter((item) => item.role || item.company || item.responsibilities),
      education: education.map((item) => ({
        degree: typeof item.degree === 'string' ? item.degree.trim() : '',
        institution: typeof item.institution === 'string' ? item.institution.trim() : '',
        year: typeof item.year === 'string' ? item.year.trim() : ''
      })).filter((item) => item.degree || item.institution || item.year)
    };

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $set: update },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(200).json(toResumeResponse(resume.toObject()));
  } catch (error) {
    return next(error);
  }
};

export default { getResume, importResume, saveResume };
