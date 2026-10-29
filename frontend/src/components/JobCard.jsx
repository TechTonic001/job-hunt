import { MapPin, Briefcase, CheckCircle2, XCircle, Mail } from 'lucide-react';

export const JobCard = ({ job }) => {
  const {
    id,
    title,
    company,
    location,
    applyEmail,
    matchScore = 0,
    matchingSkills = [],
    missingSkills = [],
    briefSummary
  } = job || {};

  const score = Math.round(Number(matchScore) || 0);

  // Compute Match Badge styling and text
  let badgeClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let badgeLabel = `Low Match: ${score}%`;

  if (score >= 80) {
    badgeClasses = 'bg-green-100 text-green-800 border-green-200';
    badgeLabel = `High Match: ${score}%`;
  } else if (score >= 60) {
    badgeClasses = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    badgeLabel = `Good Match: ${score}%`;
  }

  const handleDraftApplication = () => {
    console.log('Drafting for:', job?.id || id);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header and Match Badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{company}</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{location}</span>
            </span>
          </div>
        </div>

        {/* Match Badge: Top right corner */}
        <span
          className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeClasses}`}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Summary */}
      {briefSummary && (
        <p className="italic text-sm text-gray-600 mt-3 leading-relaxed">
          {briefSummary}
        </p>
      )}

      {/* Skills Section */}
      {((Array.isArray(matchingSkills) && matchingSkills.length > 0) ||
        (Array.isArray(missingSkills) && missingSkills.length > 0)) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
          {/* Matching Skills: Green pills with CheckCircle2 */}
          {Array.isArray(matchingSkills) &&
            matchingSkills.map((skill, index) => (
              <span
                key={`match-${index}-${skill}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>{skill}</span>
              </span>
            ))}

          {/* Missing Skills: Gray/Red pills with XCircle */}
          {Array.isArray(missingSkills) &&
            missingSkills.map((skill, index) => (
              <span
                key={`miss-${index}-${skill}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{skill}</span>
              </span>
            ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="font-mono text-xs sm:text-sm text-gray-600">
            {applyEmail || 'No direct email provided'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDraftApplication}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          Draft Application
        </button>
      </div>
    </div>
  );
};

export default JobCard;
