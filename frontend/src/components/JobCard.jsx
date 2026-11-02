import { ArrowUpRight, Briefcase, CheckCircle2, MapPin, XCircle } from 'lucide-react';

export const JobCard = ({ job }) => {
  const title = job?.job_title || job?.title || 'Untitled role';
  const company = job?.employer_name || job?.company || 'Company not listed';
  const location = job?.job_location || job?.location || 'Remote';
  const applyLink = job?.job_apply_link || job?.url;
  const score = Math.round(Number(job?.matchScore) || 0);
  const matchingSkills = Array.isArray(job?.matchingSkills) ? job.matchingSkills : [];
  const missingSkills = Array.isArray(job?.missingSkills) ? job.missingSkills : [];

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

      {applyLink && (
        <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-colors hover:bg-indigo-500"
          >
            Apply Now
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </article>
  );
};

export default JobCard;
