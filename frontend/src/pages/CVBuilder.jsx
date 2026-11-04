import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

const EMPTY_CV = {
  name: '',
  email: '',
  phone: '',
  title: '',
  skills: '',
  summary: '',
  experience: '',
  education: ''
};

const formatExperience = (experience) => {
  if (typeof experience === 'string') return experience;
  if (!Array.isArray(experience)) return '';

  return experience
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      return [
        [item.role, item.company].filter(Boolean).join(' at '),
        [item.startDate, item.endDate].filter(Boolean).join(' - '),
        Array.isArray(item.bulletPoints) ? item.bulletPoints.join('\n') : ''
      ].filter(Boolean).join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
};

const getErrorMessage = (error) => {
  const responseError = error?.response?.data?.error;
  if (typeof responseError === 'string') return responseError;
  return responseError?.message || error?.message || 'Unable to save your CV.';
};

export const CVBuilder = () => {
  const [cv, setCv] = useState(EMPTY_CV);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCv = async () => {
      try {
        const { data } = await axiosClient.get('/api/resumes');
        if (!isMounted) return;

        const personalInfo = data?.personalInfo || {};
        setCv({
          name: personalInfo.name || personalInfo.fullName || data?.name || '',
          email: personalInfo.email || '',
          phone: personalInfo.phone || '',
          title: personalInfo.title || '',
          skills: Array.isArray(data?.skills) ? data.skills.join(', ') : '',
          summary: data?.summary || personalInfo.summary || '',
          experience: formatExperience(data?.experience),
          education: typeof data?.education === 'string' ? data.education : ''
        });
      } catch (error) {
        if (isMounted) setErrorMessage(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCv();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCv((currentCv) => ({ ...currentCv, [name]: value }));
    setMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      await axiosClient.post('/api/resumes', {
        personalInfo: {
          name: cv.name.trim(),
          email: cv.email.trim(),
          phone: cv.phone.trim(),
          title: cv.title.trim()
        },
        skills: cv.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        summary: cv.summary.trim(),
        experience: cv.experience.trim(),
        education: cv.education.trim()
      });
      setMessage('CV saved successfully.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = 'w-full rounded-lg border border-white/10 bg-white/5 p-3 text-gray-200 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#09090b] px-4 py-10 text-gray-100 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">Your profile</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">CV Builder</h1>
          <p className="mt-2 text-gray-400">Build and save the CV used to personalize your job applications.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            Loading your CV...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-300">
                Name
                <input
                  name="name"
                  value={cv.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={inputClassName}
                  placeholder="Your name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-300">
                Professional Title
                <input
                  name="title"
                  value={cv.title}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="e.g. Full-Stack Engineer"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-300">
                Email
                <input
                  type="email"
                  name="email"
                  value={cv.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={inputClassName}
                  placeholder="you@example.com"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-300">
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={cv.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={inputClassName}
                  placeholder="Phone number"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-gray-300">
              Skills <span className="font-normal text-gray-500">(comma separated)</span>
              <input
                name="skills"
                value={cv.skills}
                onChange={handleChange}
                className={inputClassName}
                placeholder="JavaScript, React, Node.js"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-gray-300">
              Professional Summary
              <textarea
                name="summary"
                value={cv.summary}
                onChange={handleChange}
                rows={4}
                className={inputClassName}
                placeholder="Summarize your experience and strengths."
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-gray-300">
              Experience
              <textarea
                name="experience"
                value={cv.experience}
                onChange={handleChange}
                rows={6}
                className={inputClassName}
                placeholder="Add roles, companies, dates, and achievements."
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-gray-300">
              Education
              <textarea
                name="education"
                value={cv.education}
                onChange={handleChange}
                rows={3}
                className={inputClassName}
                placeholder="Add your education and qualifications."
              />
            </label>

            {(message || errorMessage) && (
              <p role={errorMessage ? 'alert' : 'status'} className={`text-sm ${errorMessage ? 'text-rose-300' : 'text-emerald-300'}`}>
                {errorMessage || message}
              </p>
            )}

            <div className="flex justify-end border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save CV'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default CVBuilder;
