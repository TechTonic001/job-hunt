import { MapPin, CheckCircle, XCircle, Mail } from 'lucide-react';

export const JobCard = ({ job }) => {
  const {
    id,
    title = 'Job Title',
    company = 'Company',
    location = 'Remote',
    applyEmail = '',
    matchScore = 0,
    matchingSkills = [],
    missingSkills = [],
    briefSummary = ''
  } = job || {};

  // Compute Match Badge styling and label
  const score = Math.round(Number(matchScore) || 0);
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let badgeLabel = `Low Match: ${score}%`;

  if (score >= 80) {
    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
    badgeLabel = `High Match: ${score}%`;
  } else if (score >= 60) {
    badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
    badgeLabel = `Good Match: ${score}%`;
  }

  const handleDraftApplication = () => {
    console.log('Drafting for:', id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
      {/* Top Section: Header & Match Badge */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-sm text-gray-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{company}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{location}</span>
              </span>
            </div>
          </div>

          {/* Match Badge: Top right corner */}
          <div className="shrink-0 self-start">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
            >
              {badgeLabel}
            </span>
          </div>
        </div>

        {/* Summary */}
        {briefSummary && (
          <p className="italic text-sm text-gray-600 dark:text-slate-300 mt-4 leading-relaxed">
            &ldquo;{briefSummary}&rdquo;
          </p>
        )}

        {/* Skills Section */}
        {((Array.isArray(matchingSkills) && matchingSkills.length > 0) ||
          (Array.isArray(missingSkills) && missingSkills.length > 0)) && (
          <div className="mt-5 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Matching Skills */}
            {Array.isArray(matchingSkills) && matchingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Matching:
                </span>
                {matchingSkills.map((skill, index) => (
                  <span
                    key={`match-${index}-${skill}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Missing Skills */}
            {Array.isArray(missingSkills) && missingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Missing:
                </span>
                {missingSkills.map((skill, index) => (
                  <span
                    key={`miss-${index}-${skill}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono truncate min-w-0">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{applyEmail || 'No direct email provided'}</span>
        </div>

        <button
          type="button"
          onClick={handleDraftApplication}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          Draft Application
        </button>
      </footer>
    </div>
  );
};

export default JobCard;
