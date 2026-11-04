import { useState } from 'react';
import { ArrowUpRight, Briefcase, CheckCircle2, Clipboard, Loader2, MapPin, X, XCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

export const JobCard = ({ job }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const title = job?.job_title || job?.title || 'Untitled role';
  const company = job?.employer_name || job?.company || 'Company not listed';
  const location = job?.job_location || job?.location || 'Remote';
  const applyLink = job?.job_apply_link || job?.url;
  const score = Math.round(Number(job?.matchScore) || 0);
  const matchingSkills = Array.isArray(job?.matchingSkills) ? job.matchingSkills : [];
  const missingSkills = Array.isArray(job?.missingSkills) ? job.missingSkills : [];

  const handleGenerateCoverLetter = async () => {
    setShowModal(true);
    setIsGenerating(true);
    setCoverLetter('');
    setErrorMessage('');
    setCopied(false);

    try {
      const { data } = await axiosClient.post('/api/jobs/cover-letter', {
        job_title: title,
        employer_name: company,
        job_description: job?.job_description || job?.description || ''
      });
      setCoverLetter(data.coverLetter);
    } catch (error) {
      const responseError = error?.response?.data?.error;
      setErrorMessage(
        typeof responseError === 'string'
          ? responseError
          : responseError?.message || error?.message || 'Failed to generate cover letter.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to copy the cover letter.');
    }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-gray-100">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-indigo-400">
              <Briefcase className="h-4 w-4" />
              {company}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-xs text-green-400">
          Match {score}%
        </span>
      </div>

      {job?.briefSummary && (
        <p className="mt-4 text-sm leading-relaxed text-gray-300">{job.briefSummary}</p>
      )}

      {(matchingSkills.length > 0 || missingSkills.length > 0) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {matchingSkills.map((skill, index) => (
            <span
              key={`match-${index}-${skill}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs text-green-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {skill}
            </span>
          ))}
          {missingSkills.map((skill, index) => (
            <span
              key={`missing-${index}-${skill}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300"
            >
              <XCircle className="h-3.5 w-3.5" />
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleGenerateCoverLetter}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 px-4 py-2 font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10"
        >
          Generate AI Cover Letter
        </button>
        {applyLink && (
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-colors hover:bg-indigo-500"
          >
            Apply Now
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cover-letter-title"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] text-gray-200 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 id="cover-letter-title" className="text-lg font-semibold text-gray-100">
                  Your AI Cover Letter
                </h2>
                <p className="mt-1 text-sm text-gray-400">{title} at {company}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
                aria-label="Close cover letter"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-48 flex-1 overflow-y-auto p-6">
              {isGenerating ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  <p>Writing a tailored cover letter...</p>
                </div>
              ) : errorMessage ? (
                <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-200">{coverLetter}</p>
              )}
            </div>

            <footer className="flex justify-end border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!coverLetter || isGenerating}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 px-4 py-2 font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Clipboard className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </article>
  );
};

export default JobCard;
