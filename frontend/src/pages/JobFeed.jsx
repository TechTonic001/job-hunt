import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, AlertCircle, RefreshCw, Briefcase, ArrowRight } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import JobCard from '../components/JobCard.jsx';

export const JobFeed = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial fetch on mount
  useEffect(() => {
    let isMounted = true;

    const fetchJobsOnMount = async () => {
      try {
        const response = await axiosClient.get('/api/jobs/match');
        if (isMounted) {
          setJobs(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const serverMessage =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Ensure you have created a CV first';
          setError(serverMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchJobsOnMount();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.get('/api/jobs/match');
      setJobs(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Ensure you have created a CV first';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Semantic AI Matching</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recommended Roles for You
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Jobs are automatically analyzed against your ATS resume and filtered exclusively for verified positions offering direct email applications.
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Refresh Matches</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State: Prominent Skeleton & Banner */}
      {loading && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-3 shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm font-medium">
              AI is analyzing active job listings against your ATS resume. This takes about 10 seconds...
            </p>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((skeletonId) => (
              <div
                key={skeletonId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                  </div>
                  <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-full w-28 shrink-0" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5" />
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-28" />
                </div>
                <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-44" />
                  <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-36 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-6 p-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>

          {error.toLowerCase().includes('resume') || error.toLowerCase().includes('cv') ? (
            <Link
              to="/cv-builder"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shrink-0"
            >
              <span>Go to CV Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200 transition-colors shrink-0 cursor-pointer"
            >
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* Success State: Jobs List */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-6">
          {jobs.map((job, index) => (
            <JobCard key={job.id || job._id || `job-${index}`} job={job} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Matching Jobs Found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            We couldn&apos;t find any active positions with direct email contact matching your resume skills right now. Try updating your CV or check back soon.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/cv-builder"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              Update CV Skills
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Retry Matching
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFeed;
