import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import JobCard from '../components/JobCard.jsx';

export const JobFeed = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchMatchedJobs = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get('/api/jobs/match');
        if (isMounted) {
          setJobs(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Failed to fetch matching jobs. Please ensure you have created a CV.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMatchedJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">Recommended Roles</h1>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 space-y-6">
          <p className="text-gray-600 font-medium">
            AI is analyzing active job listings against your CV. This takes about 5-10 seconds...
          </p>

          <div className="space-y-4">
            {[1, 2, 3].map((placeholder) => (
              <div
                key={placeholder}
                className="bg-white shadow-md rounded-xl p-6 border border-gray-200 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-2/3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-24 shrink-0" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                  <div className="h-6 bg-gray-200 rounded-full w-24" />
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-9 bg-gray-200 rounded-lg w-32 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Success State */}
      {!loading && !error && (
        <div className="mt-6">
          {jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map((job, index) => (
                <JobCard key={job.id || job._id || index} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-gray-600 text-lg font-medium">No matching jobs found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try updating your CV skills or checking back later for new listings.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobFeed;
