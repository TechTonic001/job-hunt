import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Save, UserRound } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

const EMPTY_CV = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  skills: '',
  summary: '',
  role: '',
  company: '',
  experienceDetails: '',
  degree: '',
  institution: '',
  graduationYear: ''
};

const getErrorMessage = (error) => {
  const responseError = error?.response?.data?.error;
  if (typeof responseError === 'string') return responseError;
  return responseError?.message || error?.message || 'Unable to save your profile.';
};

const readExperience = (experience) => {
  if (Array.isArray(experience)) {
    const entry = experience.find((item) => item && typeof item === 'object') || {};
    return {
      role: entry.role || '',
      company: entry.company || '',
      experienceDetails: Array.isArray(entry.bulletPoints)
        ? entry.bulletPoints.join('\n')
        : typeof entry.details === 'string'
          ? entry.details
          : ''
    };
  }

  return { role: '', company: '', experienceDetails: typeof experience === 'string' ? experience : '' };
};

const readEducation = (education) => {
  if (typeof education !== 'string' || !education) {
    return { degree: '', institution: '', graduationYear: '' };
  }

  const labels = ['Degree', 'Institution', 'Graduation year'];
  const lines = education.split('\n');
  const parsed = {};
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) return;
    const label = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (label === labels[0]) parsed.degree = value;
    if (label === labels[1]) parsed.institution = value;
    if (label === labels[2]) parsed.graduationYear = value;
  });

  return Object.keys(parsed).length
    ? {
        degree: parsed.degree || '',
        institution: parsed.institution || '',
        graduationYear: parsed.graduationYear || ''
      }
    : { degree: education, institution: '', graduationYear: '' };
};

export const CVBuilder = () => {
  const [cv, setCv] = useState(EMPTY_CV);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const { data } = await axiosClient.get('/api/resumes');
        if (!isMounted) return;

        const personalInfo = data?.personalInfo || {};
        const nameParts = (personalInfo.name || personalInfo.fullName || data?.name || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        setCv({
          ...EMPTY_CV,
          firstName: nameParts.shift() || '',
          lastName: nameParts.join(' '),
          email: personalInfo.email || '',
          phone: personalInfo.phone || '',
          title: personalInfo.title || '',
          skills: Array.isArray(data?.skills) ? data.skills.join(', ') : '',
          summary: data?.summary || personalInfo.summary || '',
          ...readExperience(data?.experience),
          ...readEducation(data?.education)
        });
      } catch (error) {
        if (isMounted) setErrorMessage(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCv((current) => ({ ...current, [name]: value }));
    setMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setErrorMessage('');

    const experience = cv.role.trim() || cv.company.trim() || cv.experienceDetails.trim()
      ? [{
          role: cv.role.trim(),
          company: cv.company.trim(),
          bulletPoints: cv.experienceDetails.split('\n').map((line) => line.trim()).filter(Boolean)
        }]
      : '';
    const education = [
      cv.degree.trim() ? `Degree: ${cv.degree.trim()}` : '',
      cv.institution.trim() ? `Institution: ${cv.institution.trim()}` : '',
      cv.graduationYear.trim() ? `Graduation year: ${cv.graduationYear.trim()}` : ''
    ].filter(Boolean).join('\n');

    try {
      await axiosClient.post('/api/resumes', {
        personalInfo: {
          name: [cv.firstName, cv.lastName].map((name) => name.trim()).filter(Boolean).join(' '),
          email: cv.email.trim(),
          phone: cv.phone.trim(),
          title: cv.title.trim()
        },
        skills: cv.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        summary: cv.summary.trim(),
        experience,
        education
      });
      setMessage('Your profile has been saved.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = 'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
  const skills = cv.skills.split(',').map((skill) => skill.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">Your profile</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">Resume Builder</h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Complete your profile to let AI match you with global opportunities.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
          Profile workspace
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Loading your profile...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-gray-100">Basic Info</h2>
                  <p className="text-sm text-gray-500">The details employers will see first.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-gray-300">
                  First Name
                  <input name="firstName" value={cv.firstName} onChange={handleChange} autoComplete="given-name" className={inputClassName} placeholder="First name" />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-300">
                  Last Name
                  <input name="lastName" value={cv.lastName} onChange={handleChange} autoComplete="family-name" className={inputClassName} placeholder="Last name" />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-300 sm:col-span-2">
                  Professional Title
                  <input name="title" value={cv.title} onChange={handleChange} className={inputClassName} placeholder="e.g. Full-Stack Engineer" />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-300">
                  Email
                  <input type="email" name="email" value={cv.email} onChange={handleChange} autoComplete="email" className={inputClassName} placeholder="you@example.com" />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-300">
                  Phone <span className="font-normal text-gray-500">(optional)</span>
                  <input type="tel" name="phone" value={cv.phone} onChange={handleChange} autoComplete="tel" className={inputClassName} placeholder="Phone number" />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="mb-6">
                <h2 className="font-semibold text-gray-100">Core Skills</h2>
                <p className="mt-1 text-sm text-gray-500">Separate each skill with a comma.</p>
              </div>
              <input
                name="skills"
                value={cv.skills}
                onChange={handleChange}
                className={inputClassName}
                placeholder="React, Node.js, Product Design"
                aria-label="Comma-separated skills"
              />
              <div className="mt-4 flex min-h-9 flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={`${skill}-${index}`} className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-300">
                    {skill}
                  </span>
                ))}
                {skills.length === 0 && <span className="text-sm text-gray-600">Your skills will appear here.</span>}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg lg:col-span-2">
              <div className="mb-5">
                <h2 className="font-semibold text-gray-100">Professional Summary</h2>
                <p className="mt-1 text-sm text-gray-500">A concise introduction to your experience and strengths.</p>
              </div>
              <textarea
                name="summary"
                value={cv.summary}
                onChange={handleChange}
                rows={5}
                className={inputClassName}
                placeholder="Summarize your experience, strengths, and the value you bring to a team."
              />
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="mb-6">
                <h2 className="font-semibold text-gray-100">Experience</h2>
                <p className="mt-1 text-sm text-gray-500">Share a recent role and your impact.</p>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Role
                  <input name="role" value={cv.role} onChange={handleChange} className={inputClassName} placeholder="e.g. Software Engineer" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Company
                  <input name="company" value={cv.company} onChange={handleChange} className={inputClassName} placeholder="Company name" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Responsibilities & achievements
                  <textarea name="experienceDetails" value={cv.experienceDetails} onChange={handleChange} rows={4} className={inputClassName} placeholder="Add accomplishments, one per line." />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="mb-6">
                <h2 className="font-semibold text-gray-100">Education</h2>
                <p className="mt-1 text-sm text-gray-500">Add your most relevant qualification.</p>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Degree
                  <input name="degree" value={cv.degree} onChange={handleChange} className={inputClassName} placeholder="e.g. BSc Computer Science" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Institution
                  <input name="institution" value={cv.institution} onChange={handleChange} className={inputClassName} placeholder="School or university" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-gray-300">
                  Graduation Year <span className="font-normal text-gray-500">(optional)</span>
                  <input name="graduationYear" value={cv.graduationYear} onChange={handleChange} className={inputClassName} placeholder="e.g. 2024" />
                </label>
              </div>
            </section>
          </div>

          <div className="sticky bottom-4 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#111113]/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              {message && (
                <p className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </p>
              )}
              {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
              {!message && !errorMessage && <p className="text-sm text-gray-500">Your profile powers personalized job matches.</p>}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CVBuilder;
