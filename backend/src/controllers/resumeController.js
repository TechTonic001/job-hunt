import Resume from '../models/Resume.js';

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.uid;

const formatExperience = (experience) => {
  if (typeof experience === 'string') return experience;
  if (!Array.isArray(experience)) return '';

  return experience
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';

      const heading = [item.role, item.company].filter(Boolean).join(' at ');
      const dates = [item.startDate, item.endDate].filter(Boolean).join(' - ');
      const bullets = Array.isArray(item.bulletPoints) ? item.bulletPoints.join('\n') : '';
      return [heading, dates, bullets].filter(Boolean).join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
};

const formatEducation = (education) => {
  if (typeof education === 'string') return education;
  if (!Array.isArray(education)) return '';

  return education
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';

      return [
        [item.degree, item.fieldOfStudy].filter(Boolean).join(' '),
        item.institution,
        item.graduationYear
      ].filter(Boolean).join(', ');
    })
    .filter(Boolean)
    .join('\n');
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
    experience: formatExperience(resume.experience),
    education: formatEducation(resume.education)
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

export const saveResume = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'CV data must be an object.' });
    }

    const { personalInfo = {}, summary = '', skills = [], experience = '', education = '' } = req.body;
    if (!personalInfo || typeof personalInfo !== 'object' || Array.isArray(personalInfo)) {
      return res.status(400).json({ error: 'personalInfo must be an object.' });
    }
    if (!Array.isArray(skills) || !skills.every((skill) => typeof skill === 'string')) {
      return res.status(400).json({ error: 'skills must be an array of strings.' });
    }
    if (typeof summary !== 'string' || typeof education !== 'string') {
      return res.status(400).json({ error: 'summary and education must be strings.' });
    }
    if (
      typeof experience !== 'string' &&
      !(Array.isArray(experience) && experience.every((item) => item && typeof item === 'object'))
    ) {
      return res.status(400).json({ error: 'experience must be text or an array of objects.' });
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
      experience: typeof experience === 'string' ? experience.trim() : experience,
      education: education.trim()
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

export default { getResume, saveResume };
